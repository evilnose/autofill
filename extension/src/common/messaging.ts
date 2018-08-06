export default class Messaging {
    public static readonly Source: { CONTENT: number, BACKGROUND: number, UI: number } =
        {
            CONTENT: 0,
            BACKGROUND: 1,
            UI: 2,
        };

    public static readonly SessionStatus: { IDLE: number, FETCHING: number, IN_PROGRESS: number, SUCCEEDED: number, FAILED: number, } = {
        IDLE: 0,
        FETCHING: 1,
        IN_PROGRESS: 2,
        SUCCEEDED: 3,
        FAILED: 4,
    }
}