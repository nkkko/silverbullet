import { PluginLoader, System } from "./runtime";
import { Manifest } from "./types";
import { sleep } from "../util";

export class BrowserLoader implements PluginLoader {
  readonly pathPrefix: string;

  constructor(pathPrefix: string) {
    this.pathPrefix = pathPrefix;
  }

  async load(name: string, manifest: Manifest): Promise<void> {
    await fetch(`${this.pathPrefix}/${name}`, {
      method: "PUT",
      body: JSON.stringify(manifest),
    });
  }
}

export class BrowserSystem extends System {
  constructor(pathPrefix: string) {
    super(new BrowserLoader(pathPrefix), pathPrefix);
  }
  // Service worker stuff
  async pollServiceWorkerActive() {
    for (let i = 0; i < 25; i++) {
      try {
        console.log("Pinging...", `${this.pathPrefix}/$ping`);
        let ping = await fetch(`${this.pathPrefix}/$ping`);
        let text = await ping.text();
        if (ping.status === 200 && text === "ok") {
          return;
        }
      } catch (e) {
        console.log("Not yet");
      }
      await sleep(100);
    }
    // Alright, something's messed up
    throw new Error("Worker not successfully activated");
  }

  async bootServiceWorker() {
    // @ts-ignore
    let reg = navigator.serviceWorker.register(
      new URL("../plugin_sw.ts", import.meta.url),
      {
        type: "module",
        scope: "/",
      }
    );

    console.log("Service worker registered successfully");

    await this.pollServiceWorkerActive();
  }
}