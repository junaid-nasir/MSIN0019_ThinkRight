Fliplet.Navigator.onReady().then(function () {
  return Promise.all(['fl-chat-user-token', 'fl-chat-user-id'].map(Fliplet.App.Storage.get));
}).then(function (results) {
  userToken = results[0];
  userId = results[1];

  if (!userId || !userToken) {
    return Promise.reject('User is not logged into the chat');
  }

  return Fliplet.API.request({
    method: 'POST',
    url: 'v1/data-sources/data',
    data: {
      flUserToken: userToken,
      count: true,
      where: { $not: { data: { $contains: { readBy: [userId] } } } }
    }
  });
}).then(function (response) {
  console.log('Unread messages', response.entries)
  // update UI
}).catch(function (err) {
  // user not logged in
  console.warn(err);
})