import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AxiosApi } from "../../utils/axios.utils.js";
import { AppConfig } from "../app/@types/app.interfaces.js";

@Injectable()
export class ExampleApiService extends AxiosApi {
	constructor(readonly configService: ConfigService<AppConfig, true>) {
		super({
			baseURL: configService.get("exampleAPI.baseURL", { infer: true }),
			timeout: configService.get("exampleAPI.requestTimeout", { infer: true }),
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${configService.get("exampleAPI.key", { infer: true })}`,
			},
		});
	}

	public async doSomething(body: Record<string, any>): Promise<Record<string, any>> {
		const { data } = await this.axiosInstance.post<Record<string, any>>(
			"/lorem/ipsum",
			body,
		);

		return data;
	}

	public async getSomething(query: Record<string, any>): Promise<Record<string, any>> {
		const { data } = await this.axiosInstance.get<Record<string, any>>(
			"/foo/bar",
			{ params: query },
		);

		return data;
	}
}
