/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_upload_file_api_files_upload_post } from '../models/Body_upload_file_api_files_upload_post';
import type { FileDeleteRequest } from '../models/FileDeleteRequest';
import type { FileDeleteResponse } from '../models/FileDeleteResponse';
import type { FileUploadResponse } from '../models/FileUploadResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FilesService {
    /**
     * Upload a file
     * Upload an image file. Supported formats: JPG, JPEG, PNG, GIF, WEBP, BMP. Max size: 10MB.
     * @param formData
     * @returns FileUploadResponse Successful Response
     * @throws ApiError
     */
    public static uploadFileApiFilesUploadPost(
        formData: Body_upload_file_api_files_upload_post,
    ): CancelablePromise<FileUploadResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/files/upload',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete a file
     * Delete a previously uploaded file by its URL.
     * @param requestBody
     * @returns FileDeleteResponse Successful Response
     * @throws ApiError
     */
    public static deleteFileApiFilesDeleteDelete(
        requestBody: FileDeleteRequest,
    ): CancelablePromise<FileDeleteResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/files/delete',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
