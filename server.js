const express = require("express")
const app = express();
const cookieParser = require("cookie-parser")
const path = require("path")
const UserRoute = require("./routes/UserRoute")
app.listen(process.env.PORT || 3000); // default port
const mongo = require("./modules/mongo");   


app.use(express.json());
app.use(
	express.urlencoded({
		extended: true, 
	})
);
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "public")));
app.use(
	"/bootstrap",
	express.static(path.join(__dirname, "node_modules", "bootstrap", "dist"))
);

app.set("view engine", "ejs");

(async function () {
	const db = await mongo();
	await app.use((req, res, next) => {
		req.db = db;
		next();
	});

	await app.use(UserRoute.path, UserRoute.router);
})();
