import chalk from "chalk"

export class Logger {
  constructor(private context: string) {}

  private getTimestamp(): string {
    return new Date().toISOString().replace("T", " ").substring(0, 19)
  }

  info(message: string, ...args: any[]): void {
    console.log(`${chalk.blue("INFO")} [${this.getTimestamp()}] [${this.context}] | ${message}`, ...args)
  }

  warn(message: string, ...args: any[]): void {
    console.log(`${chalk.yellow("WARN")} [${this.getTimestamp()}] [${this.context}] | ${message}`, ...args)
  }

  error(message: string, ...args: any[]): void {
    console.log(`${chalk.redBright("ERROR")} [${this.getTimestamp()}] [${this.context}] | ${message}`, ...args)
  }

  success(message: string, ...args: any[]): void {
    console.log(`${chalk.green("SUCCESS")} [${this.getTimestamp()}] [${this.context}] | ${message}`, ...args)
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === "development") {
      console.log(`${chalk.magenta("DEBUG")} [${this.getTimestamp()}] [${this.context}] | ${message}`, ...args)
    }
  }
}
