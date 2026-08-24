type ChromeTab = {
  id?: number;
  url?: string;
};

type ChromeMessageSender = {
  tab?: ChromeTab;
  url?: string;
};

type ChromeStorageArea = {
  get(keys?: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
};

type ChromePermissionDetails = {
  origins: string[];
};

type ChromeEvent<Listener extends (...args: never[]) => unknown> = {
  addListener(listener: Listener): void;
};

type ChromePort = {
  name: string;
  onDisconnect: ChromeEvent<() => void>;
  onMessage: ChromeEvent<(message: unknown) => void>;
  postMessage(message: unknown): void;
  disconnect(): void;
  sender?: ChromeMessageSender;
};

declare const chrome: {
  action: {
    setBadgeBackgroundColor(details: { color: string }): Promise<void>;
    setBadgeText(details: { text: string }): Promise<void>;
  };
  runtime: {
    connect(extensionId: string, connectInfo: { name: string }): ChromePort;
    onMessage: ChromeEvent<
      (
        message: unknown,
        sender: ChromeMessageSender,
        sendResponse: (response: unknown) => void,
      ) => boolean | void
    >;
    onConnectExternal: ChromeEvent<(port: ChromePort) => void>;
    onMessageExternal: ChromeEvent<
      (
        message: unknown,
        sender: ChromeMessageSender,
        sendResponse: (response: unknown) => void,
      ) => boolean | void
    >;
    sendMessage<T = unknown>(message: unknown): Promise<T>;
  };
  storage: {
    local: ChromeStorageArea;
  };
  tabs: {
    create(createProperties: { url: string }): Promise<ChromeTab>;
    get(tabId: number): Promise<ChromeTab>;
    onActivated: ChromeEvent<(activeInfo: { tabId: number }) => void>;
    onUpdated: ChromeEvent<(tabId: number, changeInfo: { url?: string }, tab: ChromeTab) => void>;
    query(queryInfo: { active?: boolean; lastFocusedWindow?: boolean }): Promise<ChromeTab[]>;
    sendMessage(tabId: number, message: unknown): Promise<unknown>;
    update(tabId: number, updateProperties: { url?: string }): Promise<ChromeTab>;
  };
  permissions: {
    contains(details: ChromePermissionDetails): Promise<boolean>;
    remove(details: ChromePermissionDetails): Promise<boolean>;
    request(details: ChromePermissionDetails): Promise<boolean>;
    onRemoved: ChromeEvent<(details: ChromePermissionDetails) => void>;
  };
};
