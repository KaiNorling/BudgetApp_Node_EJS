const router = require("express").Router();
const { ObjectId } = require("bson");
const { createCrypt, compareCrypt } = require("../modules/bcrypt");
const { createToken, checkToken } = require("../modules/jwt");

router.get("/", (req, res) => {
	res.render("index");
});

router.get("/signup", (req, res) => {
	res.render("sign");

});

router.post("/signup", async (req, res) => {
	const { email, password } = req.body;

	if (!(email && password)) {
		res.render("index", {
			error: "Email or Password not found",
		});
		return;
	}


	let user = await req.db.users.findOne({
		email: email.toLowerCase(),
	});

	if (user) {
		res.render("index", {
			error: "Email already exists",
		});
		return;
	}

	user = await req.db.users.insertOne({
		email: email.toLowerCase(),
		password: await createCrypt(password),
		income:[],
		expense:[],
		
	});

	res.redirect("/");
});

router.post("/", async (req, res) => {
	const { email, password } = req.body;

	if (!(email && password)) {
		res.render("index", {
			error: "Email or Password not found",
		});
		return;
	}

	user = await req.db.users.findOne({
		email: email.toLowerCase(),
	});

	if (!user) {
		res.render("index", {
			error: "User not found",
		});
		return;
	}

	if (!(await compareCrypt(user.password, password))) {
		res.render("index", {
			error: "Password is incorrect",
		});
		return;
	}

	const token = createToken({
		user_id: user._id,
	});

	res.cookie("token", token).redirect("/profile");
});

async function AuthUserMiddleware(req, res, next) {
	if (!req.cookies.token) {
		res.redirect("/");
	}

	const isTrust = checkToken(req.cookies.token);

	if (isTrust) {
		req.user = isTrust;
		next();
	} else {
		res.redirect("/");
	}
}

router.post("/profile", AuthUserMiddleware, async (req, res) => {
	const{user_id} = req.user
	const {income_description, income_amount, time} = req.body;


	await req.db.users.updateOne({
		_id: ObjectId(user_id)

	},{
		$push:{
			income:{
				$each:[{
					income_description:req.body.income_description.toLowerCase(),
					income_amount:req.body.income_amount,
					time: new Date().toLocaleString()
				}]
			}
		}
	})

	await
	res.redirect("/profile")


});


router.post("/expense", AuthUserMiddleware, async (req, res)=>{
	const {user_id}=req.user
	const {expense_description, expense_amount, time} = req.body

	await req.db.users.updateOne({
		_id: ObjectId(user_id)
	},{
		$push:{
			expense:{
				$each:[{

					expense_description: req.body.expense_description.toLowerCase(),
					expense_amount: req.body.expense_amount,
					time:new Date().toLocaleString()
				}],
			}
		}
	})
	res.redirect("/profile")
})


router.get("/profile", AuthUserMiddleware, async (req, res)=>{
	const {user_id} =req.user

	 let info = await req.db.users.findOne({
		_id: ObjectId(user_id)

	})

	let income = info.income;
	let expense= info.expense;

	let x = 0;
	function inc (){
		for(let item of info.income){
			x+=item.income_amount-0;
		}
		/*for(let item of info){
			for(let e of item){
				x+=item.income_amount
			}
		}*/
		return x;
	}
	inc()

	let y = 0;
	function exp (){
		for(let item of info.expense){
			y+=item.expense_amount-0;
		}
		return y;
	}
	exp()

	console.log(income.email);

	res.render("profile", {
		income,
		expense,
		x,
		y,
		
	})
})

module.exports = {
	router,
	path: "/",
};