declare let log: any;

declare module NodeJS {
  interface Global {
    log: any;
    app: any;
  }
}

declare namespace Express {
  export interface Application {
    service?: any
    log?: any
  }

  export interface Request {
    userId?: string
  }
}

declare namespace Inputs{
  export interface UserInput {
    email: string;
    password: string;
  }

  export interface ContactInput{
    name: string;
    email: string;
    phone: number;
  }
}
