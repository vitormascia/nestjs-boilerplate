// eslint-disable-next-line simple-import-sort/imports
import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BigNumber } from "bignumber.js";
import { OptionsInit, Request, RequestError } from "got";
import StreamArray from "stream-json/streamers/StreamArray.js";
import { finished } from "stream/promises";

import { v4 as uuidv4 } from "uuid";
import { GotClient } from "../../utils/got.utils.js";
import { AppConfig } from "../app/@types/app.interfaces.js";
import { StayProfile, StaySummary } from "../stays/@types/stays.types.js";

@Injectable()
export class BuenroMaterialsApiService extends GotClient {
	constructor(readonly configService: ConfigService<AppConfig, true>) {
		super({
			prefixUrl: configService.get("apis.buenroMaterialsAPI.baseURL", { infer: true }),
			http2: true,
			throwHttpErrors: true,
			timeout: {
				request: configService.get("apis.buenroMaterialsAPI.requestTimeoutInMilliseconds", { infer: true }),
			},
			retry: {
				limit: configService.get("apis.buenroMaterialsAPI.retryAttempts", { infer: true }),
				methods: [
					"DELETE",
					"GET",
					"PATCH",
					"POST",
					"PUT",
				],
				statusCodes: [
					HttpStatus.REQUEST_TIMEOUT,
					HttpStatus.PAYLOAD_TOO_LARGE,
					HttpStatus.TOO_MANY_REQUESTS,
					HttpStatus.INTERNAL_SERVER_ERROR,
					HttpStatus.BAD_GATEWAY,
					HttpStatus.SERVICE_UNAVAILABLE,
					HttpStatus.GATEWAY_TIMEOUT,
					/* Cloudfare HTTP codes */
					521,
					522,
					524,
				],
				errorCodes: [
					/* One of the timeout limits was reached */
					"ETIMEDOUT",
					/* The connection was forcibly closed */
					"ECONNRESET",
					/* Could not bind to any free port */
					"EADDRINUSE",
					/* The connection was refused by the server */
					"ECONNREFUSED",
					/* The remote side of the stream being written has been closed */
					"EPIPE",
					/* Could not resolve the hostname to an IP address */
					"ENOTFOUND",
					/* No internet connection */
					"ENETUNREACH",
					/* DNS lookup timed out */
					"EAI_AGAIN",
				],
				/*
						The upper limit of Retry-After Header. If undefined, it will use
						timeout.request as the value
					*/
				maxRetryAfter: undefined,
				/*
							By default, the computedValue is calculated in the following way:
							((2 ** (attemptCount - 1)) * 1000) + noise
						*/
				// calculateDelay: (retryObject: RetryObject): number => {
				// 	if (retryObject.computedValue === 0) {
				// 		return 0;
				// 	}

				// 	if (retryObject.retryAfter) {
				// 		return retryObject.retryAfter;
				// 	}

				// 	const backoff = Math.pow(2, retryObject.attemptCount - 1) * 1_000
				// 		+ retryObject.retryOptions.noise;

				// 	return backoff;
				// },
				backoffLimit: undefined,
				/* -100ms to +100ms */
				noise: new BigNumber(Math.random())
					.times(200)
					.minus(100)
					.toNumber(),
				enforceRetryRules: true,
			},
			headers: {
				"user-agent": configService.get("app.name", { infer: true }),
			},
			hooks: {
				init: [],
				beforeRequest: [
					(options): void => {
						options.headers["X-Request-Trace-ID"] = uuidv4();
					},
				],
				beforeRedirect: [],
				beforeError: [
					(error: RequestError): RequestError => {
						this.logger.error("HOOK::BEFORE_ERROR", {
							error: {
								cause: error.cause,
								message: error.message,
								name: error.name,
								stack: error.stack,
								url: error.request?.options.url?.toString(),
								status: {
									code: error.response?.statusCode,
									message: error.response?.statusMessage,
								},
								timings: error.timings,
							},
						});

						return error;
					},
				],
				/* When using the Stream API, this hook is ignored */
				beforeRetry: [],
				beforeCache: [],
				/* When using the Stream API, this hook is ignored */
				afterResponse: [],
			},
		});
	}

	public async getStaysProfiles(): Promise<Array<StayProfile>> {
		const { body: staysProfiles } = await this.gotInstance.get<Array<StayProfile>>(
			"structured_generated_data.json",
			{ responseType: "json" },
		);

		this.logger.debug("RETRIEVED_STAYS_PROFILES", { staysProfiles: staysProfiles.length });

		return staysProfiles;
	}

	public async *getStaysProfilesStream(): AsyncIterable<{
		key: number;
		value: StayProfile
	}> {
		/* Got receiver (raw Stream) */
		const stream = this.gotInstance.stream.get("structured_generated_data.json");

		// stream.on("downloadProgress", (progress: Progress): void => {
		// 	this.logger.debug("STREAM_ON::DOWNLOAD_PROGRESS", { progress });
		// });
		stream.on("response", () => {
			const downloadedBytes = stream.socket?.bytesRead ?? 0;
			const uploadedBytes = stream.socket?.bytesWritten ?? 0;

			this.logger.debug("STREAM_ON::RESPONSE", {
				downloadedBytes,
				uploadedBytes,
			});
		});
		stream.on("end", (): void => {
			const downloadedBytes = stream.socket?.bytesRead ?? 0;
			const uploadedBytes = stream.socket?.bytesWritten ?? 0;
			const totalTrafficBytes = new BigNumber(downloadedBytes)
				.plus(uploadedBytes)
				.toNumber();

			this.logger.debug("STREAM_ON::END", {
				totalTrafficBytes,
			});
		});
		stream.on("retry", (
			retryCount: number,
			error: RequestError,
			_createRetryStream: (options?: OptionsInit) => Request,
		): void => {
			this.logger.warn("STREAM_ON::RETRY", {
				retryCount,
				error: {
					cause: error.cause,
					code: error.code,
					input: error.input,
					message: error.message,
					name: error.name,
					options: error.options,
					stack: error.stack,
					timings: error.timings,
				},
			});
		});
		stream.on("error", (error: Error): void => {
			this.logger.error("STREAM_ON::ERROR", {
				error: {
					cause: error.cause,
					message: error.message,
					name: error.name,
					stack: error.stack,
				},
			});
		});
		stream.on("close", (): void => {
			this.logger.error("STREAM_ON::CLOSE");
		});
		stream.on("aborted", (): void => {
			this.logger.error("STREAM_ON::ABORTED");
		});

		/* JSON parser (StreamArray) */
		const streamArrayParser = StreamArray.withParser();
		const pipeline = stream.pipe(streamArrayParser);

		const streamFinished = finished(pipeline);

		for await (const chunk of pipeline as AsyncIterable<{ key: number; value: StayProfile }>) {
			yield chunk;
		}

		await streamFinished;
	}

	public async getStaysSummaries(): Promise<Array<StaySummary>> {
		const { body: staysSummaries } = await this.gotInstance.get<Array<StaySummary>>(
			"large_generated_data.json",
			{ responseType: "json" },
		);

		this.logger.debug("RETRIEVED_STAYS_SUMMARIES", { staysSummaries: staysSummaries.length });

		return staysSummaries;
	}

	public async *getStaysSummariesStream(): AsyncIterable<{
		key: number;
		value: StaySummary
	}> {
		/* Got receiver (raw Stream) */
		const stream = this.gotInstance.stream.get("large_generated_data.json");

		// stream.on("downloadProgress", (progress: Progress): void => {
		// 	this.logger.debug("STREAM_ON::DOWNLOAD_PROGRESS", { progress });
		// });
		stream.on("response", () => {
			const downloadedBytes = stream.socket?.bytesRead ?? 0;
			const uploadedBytes = stream.socket?.bytesWritten ?? 0;

			this.logger.debug("STREAM_ON::RESPONSE", {
				downloadedBytes,
				uploadedBytes,
			});
		});
		stream.on("end", (): void => {
			const downloadedBytes = stream.socket?.bytesRead ?? 0;
			const uploadedBytes = stream.socket?.bytesWritten ?? 0;
			const totalTrafficBytes = new BigNumber(downloadedBytes)
				.plus(uploadedBytes)
				.toNumber();

			this.logger.debug("STREAM_ON::END", {
				totalTrafficBytes,
			});
		});
		stream.on("retry", (
			retryCount: number,
			error: RequestError,
			_createRetryStream: (options?: OptionsInit) => Request,
		): void => {
			this.logger.warn("STREAM_ON::RETRY", {
				retryCount,
				error: {
					cause: error.cause,
					code: error.code,
					input: error.input,
					message: error.message,
					name: error.name,
					options: error.options,
					stack: error.stack,
					timings: error.timings,
				},
			});
		});
		stream.on("error", (error: Error): void => {
			this.logger.error("STREAM_ON::ERROR", {
				error: {
					cause: error.cause,
					message: error.message,
					name: error.name,
					stack: error.stack,
				},
			});
		});
		stream.on("close", (): void => {
			this.logger.error("STREAM_ON::CLOSE");
		});
		stream.on("aborted", (): void => {
			this.logger.error("STREAM_ON::ABORTED");
		});

		/* JSON parser (StreamArray) */
		const streamArrayParser = StreamArray.withParser();
		const pipeline = stream.pipe(streamArrayParser);

		const streamFinished = finished(pipeline);

		for await (const chunk of pipeline as AsyncIterable<{ key: number; value: StaySummary }>) {
			yield chunk;
		}

		await streamFinished;
	}
}
