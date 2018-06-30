import {Injectable} from "@angular/core";

@Injectable()
export class MessengerService {
    private processSession: ProcessSession;

    public testProcess(processJSON: object) {

    }
}

class ProcessSession {
    private myInstance = new ProcessSession();

    private constructor() {
    }

    getInstance() {
        return this.myInstance;
    }

    newSession() {

    }
}