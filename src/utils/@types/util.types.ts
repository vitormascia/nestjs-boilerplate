import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";

export type OnFulfilledRequestInterceptor =
	| ((
		value: InternalAxiosRequestConfig,
	) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>)
	| null;

export type OnFulfilledResponseInterceptor =
	| ((value: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>)
	| null;

export type OnRejectedResponseInterceptor = ((error: AxiosError) => AxiosError) | null;

export type Err = {
	cause?: unknown;
	message: string;
	name: string;
	stack?: string;
}
