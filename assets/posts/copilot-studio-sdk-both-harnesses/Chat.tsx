// Copyright (c) Microsoft Corporation. Licensed under the MIT License; see LICENSE.txt.

import React, { useEffect, useRef, useState } from 'react';
import { Components } from 'botframework-webchat';
import { FluentThemeProvider } from 'botframework-webchat-fluent-theme';
import { CopilotStudioClient, type CopilotStudioWebChatConnection } from '@microsoft/agents-copilotstudio-client';
import { acquireToken } from './acquireToken';
import { SampleConnectionSettings } from './settings';
import { createAgentActivityConnection } from './agentActivity';

const { BasicWebChat, Composer } = Components;
const styleOptions: React.ComponentProps<typeof Composer>['styleOptions'] = {
  rootHeight: '100%', rootWidth: '100%', partGroupDefaultOpen: false,
  disableFileUpload: true, hideTelephoneKeypadButton: true
};

export default function Chat() {
  const [connection, setConnection] = useState<CopilotStudioWebChatConnection>();
  const [busy, setBusy] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const current = useRef<CopilotStudioWebChatConnection | undefined>(undefined);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; current.current?.end(); };
  }, []);

  const connect = async (): Promise<void> => {
    current.current?.end();
    setConnection(undefined);
    setError('');
    setBusy(false);
    setConnecting(true);
    try {
      const settings = new SampleConnectionSettings();
      const token = await acquireToken(settings);
      if (!mounted.current) return;
      const client = new CopilotStudioClient(settings, token);
      const next = createAgentActivityConnection(
        client,
        { showReasoning: true, showToolCalls: true },
        {
          onBusyChange: value => { if (mounted.current) setBusy(value); },
          onError: failure => { if (mounted.current) setError(failure.message); }
        }
      );
      current.current = next;
      setConnection(next);
    } catch (failure) {
      if (mounted.current) setError(failure instanceof Error ? failure.message : 'Could not sign in.');
    } finally {
      if (mounted.current) setConnecting(false);
    }
  };

  return (
    <>
      {error && <div role="alert">{error} Reconnecting starts a new conversation.</div>}
      {(!connection || error) && (
        <button type="button" disabled={connecting} onClick={connect}>
          {connecting ? 'Connecting...' : connection ? 'Reconnect' : 'Sign in'}
        </button>
      )}
      {connection && (
        <FluentThemeProvider variant="copilot">
          <Composer directLine={connection} disabled={busy || Boolean(error)} styleOptions={styleOptions}>
            <BasicWebChat />
          </Composer>
        </FluentThemeProvider>
      )}
    </>
  );
}
