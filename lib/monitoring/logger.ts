export class Logger {
  static log(message: string, ...args: any[]) {
    console.log(`[LOG] ${new Date().toISOString()} - ${message}`, ...args)
  }
  
  static info(message: string, ...args: any[]) {
    console.info(`[INFO] ${new Date().toISOString()} - ${message}`, ...args)
  }
  
  static warn(message: string, ...args: any[]) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args)
  }
  
  static error(message: string, ...args: any[]) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args)
  }
  
  static debug(message: string, ...args: any[]) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args)
    }
  }
  
  static performance(label: string, callback: () => any): any {
    const start = performance.now()
    const result = callback()
    const end = performance.now()
    
    this.log(`${label} took ${(end - start).toFixed(2)}ms`)
    
    return result
  }
}

// Export singleton instance
export const logger = Logger