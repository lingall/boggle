export class Timer {
  private intervalId: number | null = null;
  private secondsLeft = 0;
  private onTick: ((secondsLeft: number) => void) | null = null;
  private onEnd: (() => void) | null = null;

  start(seconds: number, onTick: (secondsLeft: number) => void, onEnd: () => void) {
    this.stop();
    this.secondsLeft = seconds;
    this.onTick = onTick;
    this.onEnd = onEnd;
    this.onTick(this.secondsLeft);

    this.intervalId = window.setInterval(() => {
      this.secondsLeft--;
      this.onTick?.(this.secondsLeft);
      if (this.secondsLeft <= 0) {
        this.stop();
        this.onEnd?.();
      }
    }, 1000);
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
