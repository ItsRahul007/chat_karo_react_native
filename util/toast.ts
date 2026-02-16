import { ToastType } from "../components/ToastComponent";

type ShowToastFn = (message: string, type: ToastType) => void;
type HideToastFn = () => void;

class ToastService {
  private static showCallback: ShowToastFn | null = null;
  private static hideCallback: HideToastFn | null = null;

  static setRef(show: ShowToastFn, hide: HideToastFn) {
    this.showCallback = show;
    this.hideCallback = hide;
  }

  static show(message: string, type: ToastType = "success") {
    if (this.showCallback) {
      this.showCallback(message, type);
    } else {
      console.warn(
        "Toast service is not initialized. Make sure ToastProvider acts as a root component.",
      );
    }
  }

  static hide() {
    if (this.hideCallback) {
      this.hideCallback();
    }
  }

  static success(message: string) {
    this.show(message, "success");
  }

  static error(message: string) {
    this.show(message, "error");
  }

  static alert(message: string) {
    this.show(message, "alert");
  }

  static loading(message: string) {
    this.show(message, "loading");
  }
}

export const Toast = ToastService;
