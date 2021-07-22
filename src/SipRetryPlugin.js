import React from 'react';
import { VERSION, TaskHelper } from '@twilio/flex-ui';
import { FlexPlugin } from 'flex-plugin';

const PLUGIN_NAME = 'SipRetryPlugin';

export default class SipRetryPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  init(flex, manager) {
    let task = {};
    const notificationHandler = (payload, abortFunction) => {
      console.debug('NOTIFICATION HANDLER PAYLOAD: ', payload);
      console.debug('NOTIFICATION HANDLER TASK: ', task);
      console.debug('OUTBOUND CALL FAILED: ', task.attributes.outbound_to);
      if (payload.id == 'OutboundCallCanceledGeneric') {
        setTimeout(() => {
          flex.Actions.invokeAction('StartOutboundCall', {
            destination: 'sip:test1@my-demo.sip.twilio.com', // Replace with your own sip user.
          });
        }, 500);
        // Remove notification
        abortFunction();
      }
    };

    manager.workerClient.on('reservationCreated', (payload) => {
      console.debug('RES OBJ: ', payload);
      let realTask = TaskHelper.getTaskByTaskSid(payload.sid);
      if (TaskHelper.isOutboundCallTask(realTask)) {
        task = realTask;
        flex.Notifications.addListener(
          'beforeAddNotification',
          notificationHandler
        );
        payload.addListener('canceled', (payload) => {
          console.debug('BEFORE COMPLETE TASK EVENT', payload);
          if (TaskHelper.isOutboundCallTask(realTask)) {
            flex.Notifications.removeListener(
              'beforeAddNotification',
              notificationHandler
            );
          }
        });
      }
    });

    // USE FOR TESTING: Simulates a failed call example
    // Dial +12345 to make the call fail.
    flex.Actions.addListener('beforeStartOutboundCall', (payload) => {
      if (payload.destination == '+12345') {
        payload.destination = 'sip:12345@bogus.domain.com';
      }
    });
  }
}
