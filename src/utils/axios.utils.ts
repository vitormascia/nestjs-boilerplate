import { Logger } from "@nestjs/common";
import axios, {
	AxiosError,
	AxiosInstance,
	AxiosInterceptorOptions,
	AxiosRequestConfig,
	AxiosResponse,
} from "axios";
import axiosRetry, { IAxiosRetryConfig } from "axios-retry";
import BigNumber from "bignumber.js";
import { ClientRequest } from "http";
import _ from "lodash";

import { EMPTY_STRING } from "../constants/symbols.constants.js";
import time from "../constants/time.constants.js";
import {
	OnFulfilledRequestInterceptor,
	OnFulfilledResponseInterceptor,
	OnRejectedResponseInterceptor,
} from "./@types/util.types.js";

export abstract class AxiosApi {
	protected readonly logger = new Logger(this.constructor.name);
	protected readonly axiosInstance: AxiosInstance;
	private readonly defaultRetries = 3;

	constructor(
		axiosRequestConfig: AxiosRequestConfig,
		setUpAxiosRetry = false,
		axiosRetryConfig?: IAxiosRetryConfig,
	) {
		this.axiosInstance = axios.create(axiosRequestConfig);

		this.enableInterceptors();

		axiosRetryConfig ??= {
			retries: this.defaultRetries,
			retryCondition: (error: AxiosError): boolean => {
				var errorConfig: Record<string, any> = {};

				if (error.config) {
					errorConfig = {
						method: error.config.method?.toUpperCase(),
						url: error.config.baseURL && error.config.url
							? this.buildURL(error.config.baseURL, error.config.url)
							: `${error.config.baseURL ?? EMPTY_STRING}${error.config.url ?? EMPTY_STRING}`,
						params: {
							body: error.config.data,
							query: error.config.params,
						},
						headers: error.config.headers,
					};
				}

				const isRetryableError = axiosRetry.isRetryableError(error);

				this.logger.warn("RETRY_CONDITION_EXTERNAL_API_REQUEST", {
					api: this.constructor.name,
					...errorConfig,
					status: {
						code: error.response?.status || error.status,
						text: error.response?.statusText,
					},
					data: error.response?.data,
					isRetryableError,
				});

				return isRetryableError;
			},
			retryDelay: (retryCount: number, error: AxiosError): number => {
				var errorConfig: Record<string, any> = {};

				if (error.config) {
					errorConfig = {
						method: error.config.method?.toUpperCase(),
						url: error.config.baseURL && error.config.url
							? this.buildURL(error.config.baseURL, error.config.url)
							: `${error.config.baseURL ?? EMPTY_STRING}${error.config.url ?? EMPTY_STRING}`,
						params: {
							body: error.config.data,
							query: error.config.params,
						},
						headers: error.config.headers,
					};
				}

				const base = new BigNumber(2);
				const millisecondsBetweenRetries =
					base.pow(retryCount).toNumber() * time.milliseconds.second;

				this.logger.warn("RETRYING_EXTERNAL_API_REQUEST", {
					api: this.constructor.name,
					...errorConfig,
					attempt: retryCount,
					status: {
						code: error.response?.status || error.status,
						text: error.response?.statusText,
					},
					data: error.response?.data,
					millisecondsBetweenRetries,
				});

				return millisecondsBetweenRetries;
			},
		};

		if (setUpAxiosRetry) {
			const axiosRetryReturn = axiosRetry(this.axiosInstance, axiosRetryConfig);

			this.logger.debug("SET_UP_EXTERNAL_API_AXIOS_RETRY", {
				api: this.constructor.name,
				axiosRetryReturn,
			});
		}
	}

	private enableInterceptors(): void {
		this.axiosInstance.interceptors.request.use((config) => {
			this.logger.debug("REQUESTED_EXTERNAL_API", {
				api: this.constructor.name,
				method: config.method?.toUpperCase(),
				url: config.baseURL && config.url
					? this.buildURL(config.baseURL, config.url)
					: `${config.baseURL ?? EMPTY_STRING}${config.url ?? EMPTY_STRING}`,
				params: {
					body: config.data,
					query: config.params,
				},
				headers: config.headers,
			});

			return config;
		});

		this.axiosInstance.interceptors.response.use(
			(response: AxiosResponse<any, any>) => {
				this.logger.debug("EXTERNAL_API_RESPONDED", {
					api: this.constructor.name,
					method: response.config.method?.toUpperCase(),
					url: response.config.baseURL && response.config.url
						? this.buildURL(response.config.baseURL, response.config.url)
						: `${response.config.baseURL ?? EMPTY_STRING}${response.config.url ?? EMPTY_STRING}`,
					request: {
						params: {
							body: response.config.data,
							query: response.config.params,
						},
						headers: response.config.headers,
					},
					status: {
						code: response.status,
						text: response.statusText,
					},
					data: response.data,
					headers: response.headers,
				});

				return response;
			},
			async (error: AxiosError) => {
				if (error.response) {
					/*
						The request was made and the server responded with a status code
						that falls out of the range of 2xx
					*/
					this.logger.error("EXTERNAL_API_ERROR", {
						api: this.constructor.name,
						method: error.response.config.method?.toUpperCase(),
						url: error.response.config.baseURL && error.response.config.url
							? this.buildURL(error.response.config.baseURL, error.response.config.url)
							: `${error.response.config.baseURL ?? EMPTY_STRING}${error.response.config.url ?? EMPTY_STRING}`,
						request: {
							params: {
								body: error.response.config.data,
								query: error.response.config.params,
							},
							headers: error.response.config.headers,
						},
						status: {
							code: error.response.status || error.status,
							text: error.response.statusText,
						},
						data: error.response.data,
						headers: error.response.headers,
						code: error.code,
					});
				} else if (error.request) {
					/*
						The request was made but no response was received @error.request is
						an instance of http.ClientRequest in Node.js
					*/
					const requestError: ClientRequest = error.request;

					this.logger.error("MISSING_EXTERNAL_API_RESPONSE", {
						api: this.constructor.name,
						method: requestError.method,
						host: requestError.host,
						path: requestError.path,
						protocol: requestError.protocol,
						status: {
							code: requestError.req.statusCode,
							text: requestError.req.statusMessage,
						},
						headers: requestError.req.headers,
						code: error.code,
					});
				} else {
					/* Something happened in setting up the request that triggered an error */
					this.logger.error("SETTING_UP_EXTERNAL_API_REQUEST_ERROR", {
						api: this.constructor.name,
						status: { code: error.status },
						message: error.message,
						stack: error.stack,
						code: error.code,
					});
				}

				return Promise.reject(error);
			},
		);
	}

	protected addRequestInterceptor(
		onFulfilled?: OnFulfilledRequestInterceptor,
		options?: AxiosInterceptorOptions,
	): void {
		/* Do not allow to set up onRejected() for Request Interceptor */
		this.axiosInstance.interceptors.request.use(onFulfilled, undefined, options);
	}

	protected clearRequestInterceptors(): void {
		this.axiosInstance.interceptors.request.clear();
	}

	protected addResponseInterceptor(
		onFulfilled?: OnFulfilledResponseInterceptor,
		onRejected?: OnRejectedResponseInterceptor,
	): void {
		this.axiosInstance.interceptors.response.use(onFulfilled, onRejected);
	}

	protected clearResponseInterceptors(): void {
		this.axiosInstance.interceptors.response.clear();
	}

	protected buildURL(baseURL: string, path: string): string {
		/* Little trick to ensure the API version will be within the URL */
		return new URL(path.slice(1), `${baseURL}/`).toString();
	}
}
