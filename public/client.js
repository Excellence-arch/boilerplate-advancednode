$(document).ready(function () {
  /*global io*/
  let socket = io();
  socket.on("user", (data) => {
    $("#num-users").text(data.currentUsers + " users online");
    let message =
      data.username +
      (data.connected ? " has joined the chat." : " has left the chat.");
    $("#messages").append($("<li>").html("<b>" + message + "</b>"));
  });
  // socket.on("disconnect", (data) => {
  //   console.log(data);
  // });
  // Form submittion with new message in field with id 'm'
  $("form").submit(function () {
    var messageToSend = $("#m").val();

    $("#m").val("");
    return false; // prevent form submit from refreshing page
  });
});
