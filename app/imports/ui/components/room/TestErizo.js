/* global Erizo */
import React, { Component } from 'react';

/* eslint-disable */
export default class testErizo extends Component {
  componentDidMount() {
    var localStream = Erizo.Stream({ audio: true, video: true, data: true });
    var obj = { token: this.props.roomToken };
    console.log(obj);
    var room = Erizo.Room(obj);
    window.room = room;

    localStream.addEventListener("access-accepted", function () {

        var subscribeToStreams = function (streams) {
            for (var index in streams) {
              var stream = streams[index];
              if (localStream.getID() !== stream.getID()) {
                  room.subscribe(stream);
              }
            }
        };

        room.addEventListener("room-connected", function (roomEvent) {

            room.publish(localStream);
            subscribeToStreams(roomEvent.streams);
        });

        room.addEventListener("stream-subscribed", function(streamEvent) {
            var stream = streamEvent.stream;
            var div = document.createElement('div');
            div.setAttribute("style", "width: 320px; height: 240px;");
            div.setAttribute("id", "test" + stream.getID());

            document.body.appendChild(div);
            stream.play("test" + stream.getID());
        });

        room.addEventListener("stream-added", function (streamEvent) {
            var streams = [];
            streams.push(streamEvent.stream);
            console.log(streamEvent.stream);
            subscribeToStreams(streams);
        });

        room.addEventListener("stream-removed", function (streamEvent) {
            // Remove stream from DOM
            var stream = streamEvent.stream;
            if (stream.elementID !== undefined) {
                var element = document.getElementById(stream.elementID);
                document.body.removeChild(element);
            }
        });

        room.connect();
        localStream.play("myVideo");
    });
    localStream.init();
  }
  render() {
    return (
      <div id='myVideo' style={{ width:'320px', height: '240px'}}>
      </div>
    );
  }
}
/* eslint-enable */
