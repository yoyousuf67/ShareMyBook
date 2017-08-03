var http=require("http");
var express=require("express");
var bodyParser=require("body-parser");
var app=express();
var path = require('path');
var urlencodedParser=bodyParser.urlencoded({extended:false});
var  crypto= require('crypto');
var fs=require('fs');
//var session=require('express-session');
var cookieParser = require('cookie-parser');
var multer=require('multer');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
app.use(cookieParser());
app.use(bodyParser.json());
//app.use(upload());
//var upload=multer({dest:'http://filestore.c100.hasura.me/'});
/* app.use(session({
    secret: 'someRandomSecretValue',
    cookie:{maxAge:1000*60*60*24*30},
    saveUninitialized: true,
                 resave: true
}))*/
app.post("/signup",urlencodedParser,function(req,res){
  var username=req.body.Username;
  var password=req.body.password;
  var fullname=req.body.Fullname;
  var contactno=req.body.Contactno;
  console.log("Contactno is "+contactno);
  var location=req.body.location;
  var email=req.body.Email;
  if (contactno=="") {
    contactno=null;
  }
  var request = require("request");
  var options = {
     method: 'POST',
    url: 'http://auth.c100.hasura.me/signup',
    headers:
     {
       'cache-control': 'no-cache',
       'content-type': 'application/json' },
    body: { username: username, password: password },
    json: true };
request(options, function (error, response, body) {
    if (error) throw new Error(error);
    console.log(body);
    code=response.statusCode;
    if(code==200){
     token= body.auth_token;
     //console.log("token is "+token);
     user_id=body.hasura_id;
     var temp = body;
     //console.log('here is my' +temp);
     res.cookie('randomcookiename',temp, { maxAge: 345600000});

     var request1 = require("request");

     var options = { method: 'POST',
       url: 'http://data.c100.hasura.me/v1/query',
       headers:
        {
          'cache-control': 'no-cache',
          'Authorization': 'Bearer '+token,
          'content-type': 'application/json' },
       body:
        { type: 'insert',
          args:
           { table: 'Profile',
             objects:
              [ { user_id: user_id,
                  Fullname: fullname,
                  Contactinfo: contactno,
                  Email: email,
                  location: location,
                Username:username } ] } },
       json: true };

     request1(options, function (error, response, body) {
       //if (error) throw new Error(error);

       console.log('body '+body);
       console.log("code "+response.status_code);

   res.redirect('/shareorget')

 })}
 else if(code==409){
   res.send("username already exists");
 }
 else{
   res.send("some error occurred");
 }
});
});


app.post("/login",urlencodedParser,function(req,res){

  var username=req.body.Username;
  var password=req.body.Password;
  var temp;
  console.log(username);
  console.log(password);
    var req = new XMLHttpRequest();
    req.open('POST', 'http://auth.c100.hasura.me/login', true); // force XMLHttpRequest2
    req.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    req.setRequestHeader('Accept', 'application/json');
    req.send(JSON.stringify({username: username, password:password}));
    req.withCredentials = true; // pass along cookies
    req.onload = function()  {
        // store token and redirect

        try {
            temp = JSON.parse(req.responseText);
            code=req.status;
            console.log(temp);
            console.log(code);
            if(code==200){
              res.cookie('randomcookiename',temp, { maxAge: 345600000});
              res.sendFile(path.join(__dirname, 'ui', 'shareorget.html'));
            }
            else {
            res.status(code).send(temp);
            }
        } catch (error) {
            return error;
        }
    };

});





app.get('/logout', function (req, res) {
  if(req.cookies.randomcookiename==undefined){
  res.redirect('/');
}
else{
  var cookie_id = req.cookies.randomcookiename.auth_token;
  console.log(cookie_id);
  var request = require("request");

var options = { method: 'POST',
  url: 'http://auth.c100.hasura.me/user/logout',
  headers:
   { //'postman-token': '4f090490-f215-5d4f-24a2-82bc4943be69',
     'cache-control': 'no-cache',
      authorization: 'Bearer '+cookie_id,
     'content-type': 'application/json' } };

request(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);
});
if(res.statusCode == 200){
 res.sendFile(path.join(__dirname, 'ui', 'main.html'));

}
else if(req.status===500){
     res.send('Error on server side');
   }
res.clearCookie("randomcookiename");
}
});


var imgpath;
var storage = multer.diskStorage({
destination: function (req, file, cb) {
cb(null, path.join(__dirname,'filestore'))
},
filename: function (req, file, cb) {
  crypto.pseudoRandomBytes(16, function (err, raw) {
        if (err) return cb(err)
        imgpath=raw.toString('hex')+path.extname(file.originalname);
        cb(null, imgpath)
      })
    }
});

var upload = multer({ storage: storage });
app.post('/uploadfile',upload.single('Bookcover'), function uploadImage(req,res) {
var cookie_id = req.cookies.randomcookiename.auth_token;
  var user_id = req.cookies.randomcookiename.hasura_id;
  var Bookname=req.body.Bookname;
  var Author=req.body.Author;
  var Booktype=req.body.Booktype;
  var Desc=req.body.Desc;
  var Starrating=req.body.Starrating;
  var Category=req.body.Category;
  var Language=req.body.Language;
  var imgtype=req.file.mimetype;
    console.log(Bookname);
  console.log(Author);
  console.log(Category);
  console.log(Language);
  console.log(imgtype);
  console.log(imgpath);
  console.log(req.file);
  var imge=fs.readFileSync(req.file.destination+'/'+imgpath);
  var request = require("request");

  var options = { method: 'POST',
    url: 'http://filestore.c100.hasura.me/v1/file/'+imgpath,
    body: imge,
    headers:
     { //'postman-token': 'e76ccac6-1945-b495-8194-dfe7cc77bf59',
       //'cache-control': 'no-cache',
       authorization: 'Bearer '+cookie_id,
       'content-type': imgtype } };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    console.log(body);
    if (response.statusCode==200){
    var request1 = require("request");

  var options = { method: 'POST',
    url: 'http://data.c100.hasura.me/v1/query',
    headers:
     { //'postman-token': 'c8ae8374-69ce-0541-4d0d-8cb1e9f6d830',
       'cache-control': 'no-cache',
       authorization: 'Bearer '+cookie_id,
       'content-type': 'application/json' },
    body:
     { type: 'insert',
       args:
        { table: 'Book_upload',
          objects:
           [ { Book_id: imgpath ,
               User_id: user_id ,
               Bookname: Bookname,
               Author: Author,
               Booktype: Booktype,
               Desc: Desc,
               Starrating: Starrating,
             Category:Category,
           Language:Language } ] } },
    json: true };

  request1(options, function (error, response, body) {
    if (error) throw new Error(error);

    console.log(body);
    if(response.statusCode==200){
    res.redirect('/displaybook.html');
  }
  });
}
  });
  });

app.get('/getimg',function(req,res){
    var cookie_id = req.cookies.randomcookiename.auth_token;
  var request = require("request");

var options = { method: 'POST',
  url: 'http://data.c100.hasura.me/v1/query',
  headers:
   { //'postman-token': '8b55386b-1b05-dbef-6414-02b2e575203e',
     //'cache-control': 'no-cache',
     authorization: 'Bearer '+cookie_id,
     'content-type': 'application/json' },
  body:
   { type: 'select',
     args:
      { table: 'Book_upload',
        columns: [ 'Book_id', 'Bookname', 'Author', 'Booktype', 'Language' ] } },
  json: true };

request(options, function (error, response, body) {
  if (error) throw new Error(error);
  var template=``;
  var idk=body;
  for (var i = 0; i < idk.length; i++) {
    var Book_id=idk[i].Book_id;
    var Bookname=idk[i].Bookname;
    var Author=idk[i].Author;
    var Booktype=idk[i].Booktype;
    var Language=idk[i].Language;
    console.log(Language);
    var template= template+createTemplate(Book_id,Bookname,Author,Booktype,Language);
  }
  //var template=createTemplate(Book_id,Bookname,Author,Booktype,Language);
  console.log(template);
  res.send(template);
});

});

  function createTemplate (Book_id,Bookname,Author,Booktype,Language){
          var dir=__dirname;
  var htmlTemplate=` <div class="ui card" >
          <a class="image"  href="javascript:myFunction('${Book_id}')" >
            <img src="http://filestore.c100.hasura.me/v1/file/${Book_id}" style="max-height: 300px; max-width: 300px; display: block; margin: 0 auto;">
          </a>
          <div class =content>
            <a class="header">${Bookname}</a>
            <div class="meta">
              <span class="date">${Author}</span>
            </div>
            <div class="description" href="javascript:myFunction('${Book_id}')" >
              ${Language},${Booktype}
            </div>
          </div>
        </div>

   `;
      return htmlTemplate;
  }


function infotemplate(Book_id,Bookname,Author,Booktype,Desc,Starrating,Category,Language) {
  var newtemplate= `
  <div class="ui very relaxed items">
  <div class="item">
    <div class="image">
      <img src="http://filestore.c100.hasura.me/v1/file/${Book_id}">
    </div>
    <div class="content">
      <div class="ui red inverted header">${Bookname}</div>
      <div class="ui inverted segment">
        Author: ${Author}<br><br>
        Booktype: ${Booktype}<br><br>
        Category: ${Category}<br><br>
        Language: ${Language}<br><br>
        Description: ${Desc}<br><br>
        Condition of Book: <div class="ui star rating" data-rating="${Starrating}" data-max-rating="5"></div>
      </div>
    </div>
  </div>
  </div>
`;
  return newtemplate;
}

function infotemplate2(Username,location,Contactinfo,Email) {
  var newtemplate= `
  <div class="ui very relaxed items">
  <div class="item">
    <div class="image">
      <img src="/ui/dp.png">
    </div>
    <div class="content">
      <div class="ui red inverted header">Lender Info</div>
      <div class="ui inverted segment">
        Username: ${Username}<br><br>
        Location: ${location}<br><br>
        Contact No: ${Contactinfo}<br><br>
        Email: ${Email}<br><br>
      </div>
    </div>
  </div>
  </div>
`;
  return newtemplate;
}


function infotemplate3(Fullname,Username,location,Contactinfo,Email) {
  var newtemplate= `
  <div class="ui very relaxed items">
  <div class="item">
    <div class="image">
      <img src="/ui/dp.png">
    </div>
    <div class="content">
      <div class="ui red inverted header">Profile Info</div>
      <div class="ui inverted segment">
        Fullname:${Fullname}<br><br>
        Username: ${Username}<br><br>
        Location: ${location}<br><br>
        Contact No: ${Contactinfo}<br><br>
        Email: ${Email}<br><br>
      </div>
    </div>
  </div>
  </div>
`;
  return newtemplate;
}



  app.get('/intro/:myMessage', function (req, res) {
    var Book_game=req.params.myMessage;
    res.cookie('Book_id',Book_game);
    res.send('Success');
  });


  app.get('/sort/:myMessage', function (req, res) {
    var Category=req.params.myMessage;
    var cookie_id = req.cookies.randomcookiename.auth_token;
    console.log("Categ is"+ Category);
    var request = require("request");
    var template=``;

var options = { method: 'POST',
  url: 'http://data.c100.hasura.me/v1/query',
  headers:
   { //'postman-token': 'e6b1eb0f-02c6-7ec9-40e7-e4f86d1e093f',
     'cache-control': 'no-cache',
     'Authorization': 'Bearer '+cookie_id,
     'content-type': 'application/json' },
  body:
   { type: 'select',
     args:
      { table: 'Book_upload',
        columns: [ 'Book_id', 'Bookname', 'Author', 'Booktype', 'Language' ],
        where: { Category: Category } } },
  json: true };

request(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);
  var idk=body;
  if(body[0]==null){
    template=`<div class="ui huge inverted header">
      No Books Added Yet
    </div>
    `;
    console.log(template);
    res.send(template)
  }
  else{
  res.send(Sort(body));
}
});
    //console.log("here"+template);
    //res.send(template);
  });



function Sort(idk) {
  console.log(idk);
  for (var i = 0; i < idk.length; i++) {
    var Book_id=idk[i].Book_id;
    var Bookname=idk[i].Bookname;
    var Author=idk[i].Author;
    var Booktype=idk[i].Booktype;
    var Language=idk[i].Language;
    var template= template+createTemplate(Book_id,Bookname,Author,Booktype,Language);
  }
  console.log(template);
  return template;
}

  app.get('/bookdetailfetch', function (req, res) {
    var cookie_id = req.cookies.randomcookiename.auth_token;
    var Book_id = req.cookies.Book_id;
    console.log(Book_id);
    var request = require("request");

var options = { method: 'POST',
  url: 'http://data.c100.hasura.me/v1/query',
  headers:
   { 'postman-token': 'd253c7ab-f4e9-2296-a5ca-060bc1818eb5',
     'cache-control': 'no-cache',
     authorization: 'Bearer '+cookie_id,
     'content-type': 'application/json' },
  body:
   { type: 'select',
     args:
      { table: 'Book_upload',
        columns:
         [ 'User_id',
           'Bookname',
           'Author',
           'Booktype',
           'Desc',
           'Starrating',
           'Category',
           'Language' ],
        where: { Book_id: Book_id } } },
  json: true };

request(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);
  Chomu_id=body[0].User_id;
  Bookname=body[0].Bookname;
  Author=body[0].Author;
  Booktype=body[0].Booktype;
  Desc=body[0].Desc;
  Starrating=body[0].Starrating;
  Category=body[0].Category;
  Language=body[0].Language;
  res.cookie('User_id',Chomu_id);
  res.send(infotemplate(Book_id,Bookname,Author,Booktype,Desc,Starrating,Category,Language));
});
    //console.log(infotemplate(Book_game));

  });

app.get('/profiledetailfetch',function (req,res) {
  var cookie_id = req.cookies.randomcookiename.auth_token;
  var Chomu_id = req.cookies.User_id;
    var request11 = require("request");

  var options = { method: 'POST',
    url: 'http://data.c100.hasura.me/v1/query',
    headers:
     { //'postman-token': 'ce0031d1-b102-489b-5f93-757fb6f5a5c9',
       //'cache-control': 'no-cache',
       authorization: 'Bearer '+cookie_id,
       'content-type': 'application/json' },
    body:
     { type: 'select',
       args:
        { table: 'Profile',
          columns: [ 'Username', 'location', 'Contactinfo', 'Email' ],
          where: { user_id: Chomu_id } } },
    json: true };

  request11(options, function (error, response, body) {
    if (error) throw new Error(error);

    console.log(body);
    Username=body[0].Username;
    location=body[0].location;
    Contactinfo=body[0].Contactinfo;
    Email=body[0].Email;
      res.send(infotemplate2(Username,location,Contactinfo,Email));
  });
});



app.get('/profiledetailfetch2',function (req,res) {
  var cookie_id = req.cookies.randomcookiename.auth_token;
  var User_id=req.cookies.randomcookiename.hasura_id;
    var request11 = require("request");

  var options = { method: 'POST',
    url: 'http://data.c100.hasura.me/v1/query',
    headers:
     { //'postman-token': 'ce0031d1-b102-489b-5f93-757fb6f5a5c9',
       //'cache-control': 'no-cache',
       authorization: 'Bearer '+cookie_id,
       'content-type': 'application/json' },
    body:
     { type: 'select',
       args:
        { table: 'Profile',
          columns: [ 'Username', 'location', 'Contactinfo', 'Email','Fullname' ],
          where: { user_id: User_id } } },
    json: true };

  request11(options, function (error, response, body) {
    if (error) throw new Error(error);

    console.log(body);
    Username=body[0].Username;
    Fullname=body[0].Fullname;
    location=body[0].location;
    Contactinfo=body[0].Contactinfo;
    Email=body[0].Email;
      res.send(infotemplate3(Fullname,Username,location,Contactinfo,Email));

  });
});

app.get('/sharedbookfetch', function (req, res) {
  var cookie_id = req.cookies.randomcookiename.auth_token;
  var User_id=req.cookies.randomcookiename.hasura_id;
  var request = require("request");

var options = { method: 'POST',
  url: 'http://data.c100.hasura.me/v1/query',
  headers:
   { //'postman-token': '674432b9-f65d-120d-73b4-f0c600d6bee9',
     //'cache-control': 'no-cache',
     authorization: 'Bearer '+cookie_id,
     'content-type': 'application/json' },
  body:
   { type: 'select',
     args:
      { table: 'Book_upload',
        columns: [ 'Bookname','Book_id' ],
        where: { User_id: User_id } } },
  json: true };

request(options, function (error, response, body) {
  if (error) throw new Error(error);

  //console.log(body);
  var array=body;
  console.log(array);
  if(body[0]==null){
    res.send('Not Shared any Book');
  }
  else {
  res.send(loop(array));
}
});
});


function loop(array) {
  var temptemplate=`<div class="ui inverted segment">
  <div class="ui inverted relaxed divided list">`
  for (var i = 0; i < array.length; i++) {
    var Book_id=array[i].Book_id;
    var Bookname=array[i].Bookname;
    temptemplate=temptemplate+sharedbooktemplate(Bookname,Book_id);
  }
  temptemplate=temptemplate+`</div>
  </div>`
  console.log(temptemplate);
  return temptemplate
}

function sharedbooktemplate(Bookname,Book_id) {
var temp=
    `<div class="item">
      <div class="content">
      <div class="header">${Bookname}</div>
      <a href="javascript:remBook('${Book_id}')"><button class="ui right floated inverted blue button">Remove Book</button></a>
      </div>
    </div>
    `
    return temp;
}

app.get('/delbook/:delbookvalue', function (req, res) {
  var cookie_id = req.cookies.randomcookiename.auth_token;
  var delbookvalue=req.params.delbookvalue;
  console.log("Deleting book "+delbookvalue);
  var request = require("request");

var options = { method: 'POST',
  url: 'http://data.c100.hasura.me/v1/query',
  headers:
   { //'postman-token': 'c929f12b-c980-40f8-c72e-28f028204a87',
     //'cache-control': 'no-cache',
     'Authorization': 'Bearer '+cookie_id,
     'content-type': 'application/json' },
  body:
   { type: 'delete',
     args:
      { table: 'Book_upload',
        where: { Book_id: delbookvalue } } },
  json: true };

request(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);
  res.send('success');
});
});

app.get('/shareorget', function (req, res) {
  if(req.cookies.randomcookiename==undefined){
    res.redirect('/');
}
else{
  res.sendFile(path.join(__dirname, 'ui', 'shareorget.html'));
}
});

app.get('/dispbookinfo', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'dispbookinfo.html'));
});


app.get('/profileinfo.html', function (req, res) {
  if(req.cookies.randomcookiename==undefined){
    res.redirect('/');
}
else{
  res.sendFile(path.join(__dirname, 'ui', 'profileinfo.html'));
}

});

app.get('/bkimg', function (req, res) {
  res.sendFile(path.join(__dirname, 'filestore', imgpath));
});


app.get('/ui/style.css', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'style.css'));
});


app.get('/', function (req, res) {
  if(req.cookies.randomcookiename==undefined){
  res.sendFile(path.join(__dirname, 'ui', 'main.html'));
}
else{
  res.redirect('/shareorget');
}

});

app.get('/profileinfo', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'profileinfo.html'));
});

app.get('/bookdetailform', function (req, res) {
  if(req.cookies.randomcookiename==undefined){
    res.redirect('/');
}
else{
res.sendFile(path.join(__dirname, 'ui', 'bookdetailform.html'));
}

});


app.get('/displaybook.html', function (req, res) {
  if(req.cookies.randomcookiename==undefined){
    res.redirect('/');
}
else{
res.sendFile(path.join(__dirname, 'ui', 'displaybook.html'));
}

});


app.get('/info', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'info.html'));
});

app.get('/ui/backimg.jpg', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'backimg.jpg'));
});

app.get('/ui/images.png', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'images.png'));
});

app.get('/ui/dp.png', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'dp.png'));
});

var port = 8080; // Use 8080 for local development because you might already have apache running on 80
app.listen(8080, function () {
  console.log(`listening on port ${port}!`);
});
