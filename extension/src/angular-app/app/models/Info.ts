export class AppInfo {
    public abbrevName: string;
    public fullName: string;
    public url: string;
}

export interface IFixture {
    display_name: string;
    fixture_data: IUserData;
}

export interface IProcess {
    process: object;
}

export interface IUserInfo {
    app_credentials: AppCredential[];
    user_data: IUserDataMeta[];
    permissions: IPermissions;
}

export interface IPermissions {
    isAdmin: boolean;
    isSuperAdmin: boolean;
}

export class AppCredential {
    constructor(public app_id?: string,
                public username?: string,
                public password?: string) {
    }
}

export interface IUserDataMeta {
    data: IUserData;
}

export interface IUserData {
    first_name?: string;
    last_name?: string;
}

export interface IFormField {
    fieldName: string;
    displayName: string;
    description?: string;
}
