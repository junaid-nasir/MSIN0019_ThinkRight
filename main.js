//Load the session name if it exists
function loadSessionName(pvKey, formFieldName) {
  var sessionName;
  Fliplet.App.Storage.get(pvKey)
    .then(function(data) {
      if (data && data.title) {
        sessionName = data.title;
      } else {
        sessionName = data;
      }
      console.debug('Session name: ', sessionName);
      return;
    })
    .then(function() {
      // Selects form
      if (Fliplet.FormBuilder) {
        return Fliplet.FormBuilder.get();
      }
      throw new Error('No form found for session data.');
    })
    .then(function(form) {
      // set the input value
      form.field(formFieldName).val(sessionName);
    })
    .catch(function(error) {
      console.warn(error);
    });
}

function loadUserEmail(formFieldName) {
  var userEmail;
  Fliplet.Profile.get('email')
    .then(function(email) {
      // Gets user email
      userEmail = email;
      console.debug('Logged in user email: ', userEmail);
      return;
    })
    .then(function() {
      // Selects form
      if (Fliplet.FormBuilder) {
        return Fliplet.FormBuilder.get();
      }
      throw new Error('No form found for username data.');
    })
    .then(function(form) {
      // set the input value
      form.field(formFieldName).val(userEmail);
    })
    .catch(function(error) {
      console.warn(error);
    });
}

function goToScreenName(screenName) {
  Fliplet.Pages.get()
    .then(function(appPages) {
      // CHANGE - 'Admin' -> To the admin page title
      var page = _.find(appPages, {
        title: screenName
      });

      if (page) {
        var navigate = {
          page: page.id,
          action: 'screen',
          transition: 'fade'
        };
        Fliplet.Navigate.to(navigate);
        return;
      }
      throw new Error('The screen with the name "' + screenName + '" doesn\'t exist.');
    })
    .catch(function(error) {
      console.warn(error);
    });
}

function sendNewUserEmail(data) {
  var options = {
    to: [{ email: data.Email, type: 'to' }],
    html: [
      '<p>Your user has been created.</p>',
      '<p>Email: ' + data.Email + '</p>',
      '<p>Password: ' + data.Password + '</p>'
    ].join(''),
    subject: 'Your user has been created',
    from_name: 'Event App'
  };

  return Fliplet.Communicate.sendEmail(options);
}

function sendNewPasswordEmail(data) {
  var options = {
    to: [{ email: data.Email, type: 'to' }],
    html: [
      '<p>Your details have been updated as follows:</p>',
      '<p>Email: ' + data.Email + '</p>',
      '<p>Password: ' + data.Password + '</p>'
    ].join(''),
    subject: 'Your user has been created',
    from_name: 'Event App'
  };

  return Fliplet.Communicate.sendEmail(options);
}

function checkIfEmailExists(dataSourceId, email) {
  return Fliplet.DataSources.connect(dataSourceId)
    .then(function(db) {
      return db.find({ where: { Email: email } });
    })
    .then(function(users) {
      if (users.length) {
        return Promise.reject('A user with this email already exists in the system.');
      }
    });
}

// IMPORTANT
// Search for all the CHANGE comments
// Read it, you might need to change those values
// Add "fliplet-datasources" to your global resources
// Function that appends the admin menu link
function addAdminLink() {
  var adminLinkHTML =
    '<li data-page-id="" class="admin-link"><div class="fl-bottom-bar-icon-holder"><div class="fl-menu-icon"><i class="fa fa-lock"></i></div><div class="fl-menu-title"><span>Admin</span></div></div></li>';
  $('.fl-menu-body ul').append(adminLinkHTML);
  // Gets all pages and checks for the "Admin" page
  Fliplet.Pages.get()
    .then(function(appPages) {
      // CHANGE - 'Admin Menu' -> To the admin page title
      var adminPage = _.find(appPages, {
        title: 'Admin Menu'
      });
      if (adminPage) {
        var navigate = {
          page: adminPage.id,
          action: 'screen',
          transition: 'fade'
        };
        $('.admin-link').attr('data-page-id', adminPage.id);
        $('.admin-link').on('click', function() {
          $('.admin-link').addClass('active');
          Fliplet.Navigate.to(navigate);
        });
        if (adminPage.id === Fliplet.Env.get('pageId')) {
          $('.admin-link').addClass('active');
        }
        return;
      }
      throw new Error('The screen with the name "Admin" doesn\'t exist.');
    })
    .catch(function(error) {
      console.warn(error);
    });
}

function toggleAdminMode(toggle) {
  if (typeof toggle === 'undefined') {
    $('html').toggleClass('admin');
    return;
  }

  $('html')[toggle ? 'addClass' : 'removeClass']('admin');
}

function generateRandomPassword(length) {
  length = length || 10;

  // Characters that look similar have been excluded from the alphabet
  var alphabet = 'abcdefghijkmnopqrstuvwxyz!#$%&*-ABCDEFGHJKLMNPRSTUVWXYZ123456789';
  var password = '';

  for (var x = 0; x < length; x++) {
    password += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return password;
}

// Function to get the user information
function getUserData() {
  var userEmail = undefined;
  var dataSourceId = undefined;
  var query = {};
  var userData = undefined;

  //add admin link in edit or preview mode
  if (Fliplet.Env.get('mode') == 'interact') {
    toggleAdminMode(true);
    addAdminLink();
    return;
  }

  Fliplet.Profile.getAll()
    .then(function(data) {
      if (typeof data !== 'undefined' && data.constructor === Object && Object.keys(data).length) {
        // Saves user info
        userEmail = data.email;
        dataSourceId = data.user.dataSourceId;

        // CHANGE - 'Email' -> To the user's email column name
        // CHANGE - 'Admin' -> To the user's admin column name
        query.where = {
          Email: userEmail,
          Admin: 'Yes'
        };
        return;
      }
      throw new Error('User is not logged in');
    })
    .then(function() {
      // Connects to user's data source
      return Fliplet.DataSources.connect(dataSourceId);
    })
    .then(function(connection) {
      return connection.find(query);
    })
    .then(function(records) {
      // Checks if user exists and if it is admin
      userData = records[0];
      if (typeof userData !== 'undefined') {
        // If user exists, make admin only features visible
        toggleAdminMode(true);
        // If user exists, adds Admin link to menu
        addAdminLink();
        return;
      }
      throw new Error('User not found or is not an Admin');
    })
    .catch(function(error) {
      console.warn(error);
    });
}

// Invoke function above
getUserData();

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
