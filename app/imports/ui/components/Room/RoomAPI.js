import _ from 'lodash';
import status from '../../components/Room/constants/status';
import mediaPreferences from 'imports/modules/media/storage';

class RoomAPI {
  constructor(room) {
    this.room = room;

    // bind all methods as they may be invoked with different context such as onClick handler
    this.getUserId = this.getUserId.bind(this);
    this.getSession = this.getSession.bind(this);
    this.getUserInfo = this.getUserInfo.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.shareScreen = this.shareScreen.bind(this);
    this.stopScreenShare = this.stopScreenShare.bind(this);
    this.addMessageHandler = this.addMessageHandler.bind(this);
    this.removeMessageHandler = this.removeMessageHandler.bind(this);
    this.addActivityListener = this.addActivityListener.bind(this);
    this.removeActivityListener = this.removeActivityListener.bind(this);
    this.initializePrimaryMediaStream = this.initializePrimaryMediaStream.bind(this);

    this.togglePrimaryMediaStreamVideo = this.togglePrimaryMediaStreamVideo.bind(this);
    this.togglePrimaryMediaStreamAudio = this.togglePrimaryMediaStreamAudio.bind(this);
    this.mutePrimaryMediaStreamAudio = this.mutePrimaryMediaStreamAudio.bind(this);
    this.unmutePrimaryMediaStreamAudio = this.unmutePrimaryMediaStreamAudio.bind(this);
    this.mutePrimaryMediaStreamVideo = this.mutePrimaryMediaStreamVideo.bind(this);
    this.unmutePrimaryMediaStreamVideo = this.unmutePrimaryMediaStreamVideo.bind(this);
  }

  getUserId() {
    return this.room.props.roomUserId;
  }

  getSession() {
    return this.room.session;
  }

  getUserInfo(userId) {
    const { participants } = this.room.props.roomInfo;
    return _.find(participants, { userId });
  }

  sendMessage(message) {
    if (message.local) {
      debugger; // TODO
      this.room.messageHandler.handleMessage(message);
      return;
    }
    this.room.sendMessage(message);
  }

  shareScreen() {
    this.room.initializeScreenSharingStream();
  }

  stopScreenShare() {
    if (this.room.screenSharingStream) {
      this.room.stopScreenSharingStream();
    }
  }

  addMessageHandler(tabId, handler) {
    this.room.registerTabMessageHandler(tabId, handler);
  }

  removeMessageHandler(tabId, handler) {
    this.room.removeTabMessageHandler(tabId, handler);
  }

  addActivityListener(activity, listener) {
    this.room.activityListener.listen(activity, listener);
  }

  removeActivityListener(activity, listener) {
    this.room.activityListener.remove(activity, listener);
  }


  // stream related
  initializePrimaryMediaStream() {
    const streamStatus = this.room.stateBuffer.primaryMediaStreamState.status;
    if (streamStatus === status.CONNECTED || streamStatus === status.TRYING_TO_CONNECT) {
      return;
    }
    this.room.initializePrimaryMediaStream();
  }

  togglePrimaryMediaStreamVideo() {
    if (this.room.stateBuffer.primaryMediaStreamState.mutedVideo) {
      this.unmutePrimaryMediaStreamVideo();
      return;
    }
    this.mutePrimaryMediaStreamVideo();
  }

  togglePrimaryMediaStreamAudio() {
    if (this.room.stateBuffer.primaryMediaStreamState.mutedAudio) {
      this.unmutePrimaryMediaStreamAudio();
      return;
    }
    this.mutePrimaryMediaStreamAudio();
  }

  mutePrimaryMediaStreamAudio() {
    this.room.updateState({
      primaryMediaStreamState: {
        mutedAudio: { $set: true },
      },
    });
    this.room.streamManager.muteAudio(this.room.primaryMediaStream);
  }

  unmutePrimaryMediaStreamAudio() {
    this.room.updateState({
      primaryMediaStreamState: {
        mutedAudio: { $set: false },
      },
    });
    this.room.streamManager.unmuteAudio(this.room.primaryMediaStream);
  }

  mutePrimaryMediaStreamVideo() {
    this.room.updateState({
      primaryMediaStreamState: {
        mutedVideo: { $set: true },
      },
    });
    this.room.streamManager.muteVideo(this.room.primaryMediaStream);
  }

  unmutePrimaryMediaStreamVideo() {
    this.room.updateState({
      primaryMediaStreamState: {
        mutedVideo: { $set: false },
      },
    });
    this.room.streamManager.unmuteVideo(this.room.primaryMediaStream);
  }
}

export default RoomAPI;
