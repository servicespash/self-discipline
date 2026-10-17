/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Compatibility adapter for the current Rama intent parser and action engine.
 * General conversation and incomplete commands are never executed as actions.
 */

import {
  RamaActionEngine,
  type RamaActionResult
} from './ramaActionEngine';
import { RamaIntentParser } from './ramaIntentParser';

export class RamaIntentRegistryEngine {
  public async processAndExecute(
    input: string
  ): Promise<RamaActionResult | null> {
    const intent = RamaIntentParser.parse(input);

    if (
      intent.actionType === 'GENERAL_CHAT' ||
      intent.needsClarification ||
      !intent.payload
    ) {
      return null;
    }

    return RamaActionEngine.executeAction(intent.payload);
  }
}

export const RamaIntentRegistry = new RamaIntentRegistryEngine();
