import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import bcrypt from 'bcrypt';
import _ from 'lodash';
import { moment as Moment } from 'meteor/momentjs:moment';

// import jwt from 'jwt-simple';
// use a jwt? currently all members of the room will have same secret.
// maybe not for now as room will be archived after 7 days.
// but should problably use them for permission based opertation if I add some later. hmm...

import { Random } from 'meteor/random';

import { Rooms } from '../../../collections/common';

const hashPassword = Meteor.wrapAsync(bcrypt.hash);
const comparePassword = Meteor.wrapAsync(bcrypt.compare);

const { private: { saltRounds } } = Meteor.settings;

// Common error handling
const PASS_TO_CLIENT = 'PASS_TO_CLIENT';
const GENERIC_ERROR_MESSAGE = 'Something went wrong... ¯\\(°_o)/¯';

Meteor.methods({

  createRoom(roomInfo) {
    check(roomInfo, Object); // matches any object recieved for now. add validation later

    let { roomName } = roomInfo;
    roomName = roomName.trim().toLowerCase();

    roomName.split('').map((char) => {
      if (char === ' ') {
        return '-';
      }
      return char;
    });

    // error format : throw new Meteor.Error(errorTopic,reason, passToClient)
    const errorTopic = 'Failed to create Room';

    try {
      const namePattern = /^[ @a-z0-9_-]+$/;
      if (!namePattern.test(roomName)) {
        throw new Meteor.Error(errorTopic, 'Invalid Room Name ಠ_ಠ', PASS_TO_CLIENT);
      }

      const { passwordEnabled } = roomInfo;
      const password = passwordEnabled ? hashPassword(roomInfo.password, saltRounds) : null;

      const now = new Moment();
      const validTill = now.add(7, 'days').toDate().getTime();
      const roomSecret = Random.secret(14);

      const roomDocument = {
        owner: Meteor.userId() || null,
        ...roomInfo,
        roomName,
        roomSecret,
        password,
        createdAt: now.toDate().getTime(),
        validTill,
      };
      if (Rooms.findOne({ roomName })) {
        throw new Meteor.Error(errorTopic, 'Room with same name exists (；一_一)', PASS_TO_CLIENT);
      }
      // Add schema validation later.
      const roomId = Rooms.insert(roomDocument);
      if (!roomId) {
        throw new Meteor.Error(errorTopic, 'Failed to create Room');
      }

      return {
        createdRoomName: roomName,
        roomSecret,
      };
    } catch (exception) {
      const { details, reason } = exception;
      throw new Meteor.Error(
        errorTopic,
        details === PASS_TO_CLIENT ? reason : GENERIC_ERROR_MESSAGE
      );
    }
  },

  getRoomInfo(roomName) {
    check(roomName, String);
    const room = Rooms.findOne({ roomName });
    if (!room) {
      return null;
    }
    // be sure to filter for only relevent fields. dont send the whole doc lol.
    return _.pick(room, ['passwordEnabled']);
  },

  // returns null or roomSecret(string)
  authenticatePassword(roomName, password) {
    check(roomName, String);
    check(password, String);

    const room = Rooms.findOne({ roomName });
    if (!room) {
      throw new Meteor.Error('Room not found');
    } else if (comparePassword(password, room.password)) {
      return room.roomSecret;
    }
    return null;
  },
});


Meteor.publish('room.info', (roomName, roomSecret) => {
  check(roomName, String);
  check(roomSecret, String);

  return Rooms.find({ roomName, roomSecret }, {
    fields: {
      roomName: 1,
      users: 1,
      createdAt: 1,
    },
    limit: 1,
  });
});