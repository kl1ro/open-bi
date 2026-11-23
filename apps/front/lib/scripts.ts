const scriptLoadingsByUrl = new Map<string, Promise<void>>();

export function loadScript(url: string): Promise<void> {
  const scriptLoading = findScriptLoading(url) ?? startScriptLoading(url);
  return scriptLoading;
}

function findScriptLoading(url: string): Promise<void> | undefined {
  return scriptLoadingsByUrl.get(url);
}

function startScriptLoading(url: string): Promise<void> {
  const scriptLoading = appendScript(url);
  scriptLoadingsByUrl.set(url, scriptLoading);
  void scriptLoading.catch(() => forgetScriptLoading(url));
  return scriptLoading;
}

function appendScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.addEventListener("load", () => resolve());

    script.addEventListener("error", (event) => {
      script.remove();
      reject(new ScriptNotLoadedError({ url, cause: event }));
    });

    document.head.append(script);
  });
}

export class ScriptNotLoadedError extends Error {
  public name = ScriptNotLoadedError.name;
  public url: string;

  public constructor(options: ErrorOptions & { url: string }) {
    super(`Script ${options.url} is not loaded`, options);
    this.url = options.url;
  }
}

function forgetScriptLoading(url: string) {
  scriptLoadingsByUrl.delete(url);
}
