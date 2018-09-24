import {Component, OnInit} from "@angular/core";
import {DbService} from "../services/db.service";
import {Status} from "../partials/status-dot.component";
import {AuthService} from "../services/auth.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
    template: `
        <div *ngIf="promptParam === 'delete-now'" class="alert alert-info">
            <h2>Verification successful</h2>
            You are now verified to delete your account.
        </div>
        <h2>My Account</h2>
        <p>Manage data associated with your account here.</p>
        <h3 class="my-4">Application Credentials</h3>
        <p>You can save the credentials for each app when you <a routerLink="/send">send</a>.</p>
        <res-list [getResListFn]="getCredentialsFn">
            <ng-template let-res>
                <div class="row res-row">
                    <div class="col-md-6 container-center ht-5">
                        <span class="resource-name text-center">{{res.appFullName}}</span>
                    </div>
                    <div class="col-md-6 container-center py-2">
                        <div>
                            <b>Username</b>
                            <p>{{res.username}}</p>
                            <b>Password</b>
                            <peek><p class="mb-0" style="display: inline">{{res.password}}</p></peek>
                        </div>
                    </div>
                </div>
            </ng-template>
        </res-list>
        <div *ngIf="deleteAccountStatus === StatusRef.PENDING" class="alert alert-warning">
            Deleting your account...
        </div>
        <div *ngIf="deleteAccountStatus === StatusRef.FAILED" class="alert alert-danger">
            Failed to delete your account. Reason: {{lastError}}. You can report this to collegeapp.autofill@gmail.com.
        </div>
        <div *ngIf="deleteAccountStatus === StatusRef.SUCCESS" class="alert alert-success">
            Account deletion successful.
        </div>
        <div class="danger-zone justify-content-center">
            <div class="row">
                <div class="col-md-8 container-center">
                    <span class="big-note">Permanently delete this account and all data associated with it:</span>
                </div>
                <div class="col-md-4 flex-d">
                    <button class="btn btn-danger ml-auto" (click)="deleteAccount()" [disabled]="deleteAccountStatus===StatusRef.PENDING">DELETE MY ACCOUNT</button>
                </div>
            </div>
        </div>
    `,
    styleUrls: ['../../assets/scss/app.scss', '../partials/resource-list.component.scss'],
})
export default class AccountComponent implements OnInit {
    private getCredentialsFn: () => any = () => this.dbService.getCredentialDocs(false)
        .then(async (docs: any[]) => {
            const resources: object[] = [];
            for (const doc of docs) {
                const resource = {
                    data: doc.data(),
                    'delete': () => doc.ref.delete(),
                };
                const appDoc = await this.dbService.getAppDoc(resource.data.app_id);
                resource.data.appFullName = appDoc.data().fullName;
                resources.push(resource);
            }
            return resources;
        });
    private deleteAccountStatus: Status;
    private StatusRef = Status;
    private lastError: string;
    private promptParam: string;

    constructor(public dbService: DbService, private authService: AuthService, private router: Router, private activatedRoute: ActivatedRoute) {
        this.deleteAccountStatus = Status.IDLE;
    }

    ngOnInit() {
        this.activatedRoute.queryParams.subscribe((params) => {
            this.promptParam = params.prompt;
        });
    }

    async deleteAccount() {
        const sure = window.confirm("This will delete your account and all your data permanently. Are you sure?");
        if (sure) {
            try {
                this.deleteAccountStatus = Status.PENDING;
                await this.dbService.deleteUserAccountAndData();
                this.deleteAccountStatus = Status.SUCCESS;
            } catch (e) {
                if (e.code === "auth/requires-recent-login") {
                    alert("Since deleting your account is a sensitive action, a recent login is required. " +
                        "You will be logged out and asked to log in again.");
                    await this.authService.logout();
                    this.authService.redirectUrl = '/account';
                    this.router.navigate(['/login'], {
                        queryParams: {
                            reason: 'delete-account',
                        },
                    });
                    return;
                }
                this.deleteAccountStatus = Status.FAILED;
                this.lastError = e;
            }
        }
    }
}