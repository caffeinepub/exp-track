import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface OCRParams {
    base64Image: string;
}
export interface Expense {
    userName: string;
    date: bigint;
    description: string;
    occasionId?: string;
    imageId?: ExternalBlob;
    amount: number;
}
export interface http_header {
    value: string;
    name: string;
}
export interface OCRResponse {
    rawText: string;
    amount?: number;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Occasion {
    id: string;
    participants: Array<string>;
    name: string;
    createdAt: bigint;
    createdBy: Principal;
    description: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface UserProfile {
    displayName: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addParticipantToOccasion(occasionId: string, participantName: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createExpense(expense: Expense): Promise<bigint>;
    createOccasion(name: string, description: string): Promise<string>;
    extractAmountFromImage(params: OCRParams): Promise<OCRResponse>;
    getAggregateTotals(): Promise<Array<[string, number]>>;
    getAllExpenses(): Promise<Array<Expense>>;
    getAllOccasions(): Promise<Array<Occasion>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getExpensesByOccasion(occasionId: string): Promise<Array<Expense>>;
    getExpensesByUser(user: Principal): Promise<Array<Expense>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    reset(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setDisplayName(displayName: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    uploadImage(params: ExternalBlob): Promise<ExternalBlob>;
}
