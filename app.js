const http     = require("http")
const path     = require("path")
const fs       = require("fs")
const port     = 8080
const chokidar = require("chokidar")

obj = walk_folder(__dirname)

suppr = true
replace = true

//

server(null,"html")

//

chokidar.watch( ".", { ignoreInitial:true } )
.on("all", (event,px) => {

	let pathx = path.join(__dirname,px)

	try {

		let idx = undefined
		if( fs.existsSync(pathx) ){
		st = fs.statSync(pathx)
		idx = (st.dev+st.ino).toString()
		}

		if( event == "add" && Object.keys(obj).includes(idx) ){

			if( path.dirname(obj[idx][1]) == path.dirname(pathx) ){

				console.log("File renamed",idx)

				obj[idx]=[fs.statSync(pathx).size,pathx]
				suppr=false

			}else{

				console.log( `File moved in folder ${pathx.split("\\").at(-2)}`, idx )

				obj[idx]=[fs.statSync(pathx).size,pathx]
				suppr=false
			}
		}	

		else if( event == "add" && !Object.keys(obj).includes(idx) ){
			
			console.log("File created",idx)

			if( idx )
			obj[idx]=[fs.statSync(pathx).size,pathx]

		}

		else if( event == "change" && pathx != obj[idx][1] ){

			console.log(`File replace ${idx} :`)

			let n = ( () => { for( let [k,v] of Object.entries(obj) ) if( v[1] == pathx ) return k })()

			delete obj[n]

			obj[idx]=[fs.statSync(pathx).size,pathx]

			replace = false
		
		}else if( event == "unlink" ){

			for( let [i,x] of Object.entries(obj) ){

				if( pathx == x[1] && suppr && replace ){

					console.log(`File deleted ${i}`)

					delete obj[i]
				}
			}

			suppr = true
			replace = true

		}else{

			console.log(event,px)

		}

	}catch(e){

		console.log("error")
	}

})

function walk_folder(dir,ob={}) {

	let list = fs.readdirSync(dir)

	list.forEach( file => {
		
		let pathx = dir + "\\" + file
		
		let stats = fs.statSync(pathx)

		if ( stats.isFile() ) {

			ob[stats.dev+stats.ino]=[stats.size,pathx]

		}else if ( stats.isDirectory() ){

			walk_folder(pathx,ob)
		}
		
	})

	return ob

}

function walk_json(dir,obj={}) {

	let list = fs.readdirSync(dir)

	list.forEach( file => {
		
		pathx = dir + '\\' + file
		
		let stats = fs.statSync(pathx)

		if ( stats.isFile() ) {

			obj[file] = stats.size
			
		}else if (stats.isDirectory()){

			obj[path.basename(pathx)] = {}

			walk_json(pathx,obj[path.basename(pathx)])
		}
		
	})

	return obj

}

//

function jsontree(x,obj={"str":""},i=0,table=[]){

	for ( let y of Object.keys(x) ) {

		if ( typeof x[y] != 'object' ){

			obj.str += `<li onclick=""><span>${y} : ${x[y]}</span></li>`

		}else{

			if( Object.entries(x[y]).length === 0 ){

				obj.str += `<li id="parent"><button onclick="foo(this)">${y}</button>
				<ul>
				<li><i>dossier vide</i></li>
				</ul>
				</li>`

			}else{

			    obj.str += `<li id="parent"><button onclick="foo(this)">${y}</button><ul>`

			    table.push(y)

			    rec(x[y],obj,i,table)

			    table.pop()

			    obj.str += `</ul></li>`

		  	}

		}

	}

	return obj.str

}

function render(p){ return `<style>

ul,li{
	
	list-style-type: circle;
	white-space: nowrap;
}

ul {

	margin-top: 0;
}

li#parent{
	
	list-style-type: square;
}

.hide{

	display: none;
}

button{
	
	cursor:pointer;
	border: none;
	background: none;
	background: lightgreen;
	margin: 5px;
	white-space: pre;
}

</style>

${p}

<script>

function foo(e){

	e.parentElement.children[1].classList.toggle("hide")
}

</script>`

}

function server(x,n) {

	const http = require("http")
	const PORT = 8080

	http.createServer(function (req, res) {
		
		res.writeHead(200,{"content-type":`text/${n};charset=utf8`})

		if ( req.url == "/" )
		console.log(obj)

		res.end( render( jsontree( walk_json(__dirname) ) ) )
	  
	}).listen(PORT)

	console.log(`Running at port ${PORT}`)

}
