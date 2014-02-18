var koa = require('koa')
var app = koa()
var fs = require('fs')
var url = require('url')

app.use(function *(next){
  var path = url.parse(this.url, true)
  console.log(path)
  var jsspPath = '.' + path.pathname + '.jssp'
  var st = yield stat(jsspPath)
  if (st && st.isFile()){
    this.query = path.query
    this.path = path.pathname
    var result = yield compile(jsspPath)
    try{
      var gen = eval(result)
    }catch(e){
      console.log('SyntaxError:', e.message)
      console.log(result)
      yield next
      return
    }
    console.log(result)
    gen.bind(this)().next()
  }else{
    yield next
  }
})

function stat(file) {
  return function(done){
    fs.stat(file, done)
  }
}

function compile(file){
  return function(done){
    fs.readFile(file, function(err, code){
      if (err) return done(err)
      code = String(code)
      code = code.replace(/"/g, '\\"')
      code = code.replace(/\<\%\=(.*)\%\>/g, '" + ($1) + "')
      code = code.replace(/\n/g, '\\n\\\n')
      code = '(function *(){\n  this.body = "' + code + '"\n})'
      done(null, code)
    })
  }
}

app.listen(3000)