require('dotenv').config()
const express = require('express');
const router = express.Router();
const colors = require('colors');
const randtoken = require('rand-token');
const bcrypt = require('bcryptjs');
const {
    getId,
    clearSessionValue,
    getCountryList,
    mongoSanitize,
    sendEmail,
    clearCustomer
} = require('../lib/common');
const mailer=require('../misc/mailer');
const rateLimit = require('express-rate-limit');
const { indexCustomers } = require('../lib/indexing');
const { validateJson } = require('../lib/schema');
const { restrict } = require('../lib/auth');
const Razorpay = require('razorpay');
var keyid = "rzp_test_rBXuI8IeffKFxy";
var keysecret = "OoIdqomItn95AxYNTZW5fWts";
var instance = new Razorpay({
    key_id: keyid,
    key_secret: keysecret
  })

//*********************************//

const authy = require('authy')('Tc1xj533paqoFeoX8BCQq67jzRXSpQgO');

const apiLimiter = rateLimit({
    windowMs: 300000, // 5 minutes
    max: 5
});

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

router.post('/customer/register', async function(req, res) {
    const config = req.app.config;
    const db = req.app.db;

	var isSuccessful = false;

	var email = req.body.shipEmail;
	var phone = req.body.shipPhoneNumber;;
	var countryCode = '+91';
    
    var customer = await db.customers.findOne({phone:req.body.mobile_no});

    if(!isEmpty(customer)){
        req.session.message = "A customer already exist with that email or Phone";
        req.session.messageType = 'danger';
        res.redirect('/checkout/information');
        return;
    }
    var data ={
        candidate_name:req.body.candidate_name,
        guardian_name : req.body.guardian_name,
        dob : req.body.dob,
        age : req.body.age,
        address :req.body.address,
        ward_no : req.body.ward_no,
        edu_qualification : req.body.edu_qualification,
        tech_qualification : req.body.tech_qualification,
        aadhar_no : req.body.aadhar_no,
        service_area : req.body.service_area,
        Pan : req.body.Pan,
        gst : req.body.gst,
        bank_account : req.body.bank_account,
        bank_name : req.body.bank_name,
        mobile_no : req.body.mobile_no,
        service_area : req.body.service_area,
        business_area : req.body.business_area,
        area_experience : req.body.area_experience,
        category : req.body.category,
        other_information : req.body.other_information
     }

     await db.customers.insertOne({
         info:data
     })

     res.redirect("/");
	/*authy.register_user(email, phone, countryCode, function (regErr, regRes) {
    	console.log('In Registration...');
    	if (regErr) {
       		console.log(regErr);
               message = "There was some error registrating the user try again";
                req.session.message = message;
                req.session.messageType = 'danger';
               res.redirect('/checkout/information');
               return;
    	} else if (regRes) {
			console.log(regRes);
			console.log("Here we go for the practice part"+regRes.user.id);
            // Set the customer into the session
            req.session.customerEmail = req.body.shipEmail;
            req.session.customerFirstname = req.body.shipFirstname;
            req.session.customerLastname = req.body.shipLastname;
            req.session.customerAddress1 = req.body.shipAddr1;
            req.session.customerState = req.body.shipState;
            req.session.customerPostcode = req.body.shipPostcode;
            req.session.customerPhone = req.body.shipPhoneNumber;
    		authy.request_sms(regRes.user.id, function (smsErr, smsRes) {
				console.log('Requesting SMS...');
    			if (smsErr) {
    				console.log(smsErr);
					res.send('There was some error sending OTP to cell phone.');
                    req.session.message = result.error_text;
                    req.session.messageType = 'danger';
                    res.redirect('/checkout/information');
                    return;
    			} else if (smsRes) {
                    let paymentType = '';
                    if(req.session.cartSubscription){
                        paymentType = '_subscription';
                    }
                    req.session.requestId = regRes.user.id;
                        res.render(`${config.themeViews}checkout-information`, {
                            title: 'Checkout - Information',
                            config: req.app.config,
                            session: req.session,
                            categories: req.app.categories,
                            paymentType,
                            cartClose: false,
                            page: 'checkout-information',
                            message: clearSessionValue(req.session, 'message'),
                            messageType: clearSessionValue(req.session, 'messageType'),
                            helpers: req.handlebars.helpers,
                            showFooter: 'showFooter'
                        });
    			}
			});
    	}
   	});*/
});

router.get('/employee/register',async (req,res)=>{
    const config = req.app.config;

    res.render(`${config.themeViews}registrationForm`, {
        title: 'Registration',
        config: req.app.config,
        session: req.session,
        categories: req.app.categories,
        page: 'checkout-information',
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: 'showFooter'
    });
});
router.get('/customer/options', async (req,res)=>{
    const config = req.app.config;
    const db = req.app.db; 
    const car = await db.vehicles.find({"submenu.type": "car"}).sort({"title":1}).toArray();
    const bike = await db.vehicles.find({"submenu.type": "bike"}).sort({"title":1}).toArray();
    var servicecentre = await db.servicecentre.find({type: 'car'}).toArray();
    var servicecentre3 = await db.servicecentre.find({type: 'bike'}).toArray();
    // Car Sort Service Centre
    var servicelist = [];
    for (var j=0;j<servicecentre.length;j++) {
        servicelist.push([servicecentre[j].title.split(" ")[0],j])
    }
    servicelist.sort();
    var servicecentre2 = [];
    for(var j=0;j<servicelist.length;j++) {
        servicecentre2.push(servicecentre[servicelist[j][1]]);
    }
    // Bike Sort Service Centre
    var servicelist2 = [];
    for (var j=0;j<servicecentre3.length;j++) {
        servicelist2.push([servicecentre3[j].title.split(" ")[0],j])
    }
    servicelist2.sort();
    var servicecentre4 = [];
    for(var j=0;j<servicelist2.length;j++) {
        servicecentre4.push(servicecentre3[servicelist2[j][1]]);
    }
    var bike2 = [];
    for(var i = 0;i<bike.length;i++){
    var k = bike[i];
    var submenu = bike[i].submenu;
    k.submenu = [];
  
    for(var j=0; j<submenu.length; j++) {
        if(submenu[j]["type"] == "bike"){
            k.submenu.push(submenu[j]);
        }
    }
    bike2.push(k);
}
var car2 = [];
    for(var i = 0;i<car.length;i++){
    var k = car[i];
    var submenu = car[i].submenu;
    k.submenu = [];
  
    for(var j=0; j<submenu.length; j++) {
        if(submenu[j]["type"] == "car"){
            k.submenu.push(submenu[j]);
        }
    }
    car2.push(k);
}

    res.render(`${config.themeViews}options`, {
        title: 'Choose your car',
        config: req.app.config,
        session: req.session,
        servicecentre: servicecentre2,
        servicecentre3: servicecentre4,
        categories: req.app.categories,
        vehicles: car2,
        bike: bike2,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: true
    });
});
router.get('/customer/services', async (req,res)=>{
    const config = req.app.config;
    const db = req.app.db; 
    const car = await db.vehicles.findOne({_id: getId(req.session.carName)});
    var url = "";
    if(!car) {
        req.session.message = "Vehicle Not Selected";
        req.session.messageType = "danger";
        res.redirect('/customer/options');
        return;
    }
    var vehicletype = "car";
    var title = car.title;
    req.session.carTitle=car.title;

    for(var i =0;i < car.submenu.length; i++){
        if(car.submenu[i].name == req.session.modelName){
            url = car.submenu[i].path;
            if(car.submenu[i].type == "bike"){
                vehicletype = "bike";
            }
        }
    }

    const welcome = await db.products.find({}).toArray();
    const discounts = await db.products.find({productVehicle: vehicletype}).toArray();


    res.render(`${config.themeViews}services`, {
        title: 'Available Services',
        config: req.app.config,
        session: req.session,
        results:discounts,
        carName: title,
        modelName: req.session.modelName,
        carurl: url,
        vehicletype:vehicletype,
        serviceCenter: req.session.serviceCenter,
        categories: req.app.categories,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: true
    });
});
//csutomer value choice
router.post('/checkout/order/new',async (req,res)=>{
    var db = req.app.db;
    var order = await db.orders.findOne({_id: getId(req.body.id)});
    if(!order){
        req.status(400).send({message: "Order Not Available"});
        return;
    }
    var price = parseInt(order.orderPrice);
    if(!price){
        req.status(400).send({message: "Price Not Available"});
        return;
    }
    req.session.orderdbpay = req.body.id;
    var amount = parseInt(Number(price) * 100);
    var options = {
        amount: amount,  // amount in the smallest currency unit
        currency: "INR",
        receipt: "rcptid_11"
      };
      req.session.razorpayamount = amount;
      console.log(options);
      var orderid = '';
      instance.orders.create(options, function(err, order) {
          if(err){
              console.log(err);
          }
        console.log(order);
        req.session.orderidgenerated = true;
        orderid = order.id;
        req.session.razorOrderId = order.id;
        res.status(200).send({message: order.id});
        return;
      });     
});
router.post('/checkout/order/set', async (req,res)=>{
    console.log("checkout set session",req.body.order_id);
    req.session.razororderId = req.body.order_id;
    req.session.razoridgenerated = true;
    return;
});

router.post('/customer/value',async(req,res)=>
{
    const config = req.app.config;
    const db = req.app.db; 
    const car = await db.vehicles.findOne({_id: getId(req.body.country)});

    console.log(car);
    req.session.carName = req.body.country;
    req.session.modelName = req.body.choices1;
    req.session.serviceCenter = req.body.choices2;
    req.session.orderType = "car"

    if(!req.session.carName || !req.session.modelName || !req.session.serviceCenter) {
        req.session.message = "Choose Value from all the dropdown";
        req.session.messageType = "danger";
        res.redirect('/customer/options');
        return;
    }
    console.log("This is in customer/value form");
    console.log(req.session.carName);
    console.log(req.session.modelName);
    console.log(req.session.serviceCenter);
    res.redirect('/customer/services');

});
router.post('/customer/value2',async(req,res)=>
{
    const config = req.app.config;
    const db = req.app.db; 
    
    req.session.carName = req.body.country1;
    req.session.modelName = req.body.choices1;
    req.session.serviceCenter = req.body.choices2;
    req.session.orderType = "bike"
    console.log(req.session.carName);
    console.log(req.session.modelName);
    console.log(req.session.serviceCenter);
    if(!req.session.carName || !req.session.modelName || !req.session.serviceCenter) {
        req.session.message = "Choose Value from all the dropdown";
        req.session.messageType = "danger";
        res.redirect('/customer/options');
        return;
    }
   
    res.redirect('/customer/services');

});

router.post('/customer/pickup',async(req,res)=>
{
    const config = req.app.config;
    const db = req.app.db; 
    var address = {
        "name":req.body.pickupName,
        "phone":req.body.pickupPhone,
        "alternatePhone":req.body.pickupAlternate,
        "addressline": req.body.pickupAddress,
        "city": req.body.pickupCity,
        "pincode": req.body.pickupPincode
    };
    var minlength = 0;
    for(let i in address){
        if(address[i].length < 1) {
            minlength = 1;
            break;
        }
    }
    if(minlength == 1){
        res.status(400).json({message: "All Fields must have length above 1"});
    }
    var addresses = address;
    console.log("this is working fine till here",req.body.customerId);
    try{
        /*await db.customers.updateOne({ _id: getId(req.body.customerId) },
        { $push: { pickupaddress: addresses} });*/
        req.session.customerpickaddress = req.body.pickupAddress;
        req.session.customerpickcity = req.body.pickupCity;
        req.session.customerpickpostcode = req.body.pickupPincode;
        req.session.customerpickname = req.body.pickupName;
        req.session.customerpickphone = req.body.pickupPhone;
        req.session.pickupAlternate = req.body.pickupAlternate;
        res.status(200).json({message: "Address Updated"});
    }catch(ex){
        console.log(ex);
        res.status(400).json({message: "Error Updating Address"});
    }
});

router.post('/customer/dropup',async(req,res)=>
{
    const config = req.app.config;
    const db = req.app.db; 
    var address = {
        "name":req.body.dropupName,
        "phone":req.body.dropupPhone,
        "alternatePhone":req.body.dropupAlternate,
        "addressline": req.body.dropupAddress,
        "city": req.body.dropupCity,
        "pincode": req.body.dropupPincode
    };
    var minlength = 0;
    for(let i in address){
        if(address[i].length < 1) {
            minlength = 1;
            break;
        }
    }
    if(minlength == 1){
        res.status(400).json({message: "All Fields must have length above 1"});
    }
    var addresses = address;
    try {
       /* await db.customers.updateOne({ _id: getId(req.body.customerId) },
        { $push: { dropupaddress: addresses} });*/
        req.session.customerdropaddress = req.body.dropupAddress;
        req.session.customerdropcity = req.body.dropupCity;
        req.session.customerdroppostcode = req.body.dropupPincode;
        req.session.customerdropname = req.body.dropupName;
        req.session.customerdropphone = req.body.dropupPhone;
        req.session.dropupAlternate = req.body.dropupAlternate;
        res.status(200).json({message: "Adress Update Successfull"});
    }catch(ex) {
        console.log(ex);
        res.status(400).json({message: "Adress Update Failed"});
    }
});


router.get('/cutsomer/testing',async(req,res)=>{
    const config = req.app.config;
    const db = req.app.db;

    const customerArray = await db.customers.findOne({
        email: req.session.customerEmail})

    res.render(`${config.themeViews}checkout-information`, {
        title: 'Address',
        session: req.session,
        customerArray: customerArray,
        showFooter: "ShowFooter",
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        config: req.app.config,
        helpers: req.handlebars.helpers
    });

})

//project ends here 




router.post('/customer/otprequestreset',(req, res)=>{
    delete req.session.requestId;
    res.status(200).send('Reset done');
});
router.post('/customer/registerdirect', async (req, res)=>{
    const config = req.app.config;
    const db = req.app.db;

    var email = req.body.userEmail;
	var phone = req.body.userPhone;
    var countryCode = '+91';
    
    if(email.length < 5 || phone.length < 10 || isNaN(phone)) {
        res.status(400).send("Invalid Phone number or Email")
        return;
    }
    var customer = await db.customers.findOne({$or: [{email: email},{phone: phone}]});
    if(!isEmpty(customer)){
        res.status(400).send('A customer already exist with that email and phone');
        return;
    }

    authy.register_user(email, phone, countryCode, function (regErr, regRes) {
    	if (regErr) {
                res.status(400).send('There was some error registrating the user try again');
               return;
    	} else if (regRes) {
            // Set the customer into the session
            req.session.customerEmail = req.body.userEmail;
            req.session.customerPhone = req.body.userPhone;
    		authy.request_sms(regRes.user.id, function (smsErr, smsRes) {
    			if (smsErr) {
    				console.log(smsErr);
                    res.status(400).send('There was some error sending OTP to cell phone.');
                    return;
    			} else if (smsRes) {
                    let paymentType = '';
                    if(req.session.cartSubscription){
                        paymentType = '_subscription';
                    }
                    req.session.requestId = regRes.user.id;
                    res.status(200).send('Otp Send to your phone number');
                    return;
    			}
			});
    	}
   	});
});
router.post('/customer/confirm', async (req, res)=> {
	console.log('New verify request...');
    const config = req.app.config;
	const id = req.body.requestId;
	const token = req.body.pin;
    const originalUrl = req.body.originalUrl;
	authy.verify(id, token, async (verifyErr, verifyRes)=> {
		console.log('In Verification...');
		if (verifyErr) {
			console.log(verifyErr);
            req.session.message = "Wrong Otp number";
            req.session.messageType = 'danger';
            res.redirect('/checkout/information');
            return;
		} else if (verifyRes) {
            console.log("Is session working properly"+req.session.customerEmail);
            const db = req.app.db;
    
            var customerObj = {};
            delete req.session.requestId;

            if(!req.session.customerFirstname){
                customerObj = {
                    email: req.session.customerEmail,
                    phone: req.session.customerPhone,
                    password: bcrypt.hashSync(req.body.shipPassword, 10),
                    created: new Date()
                };
            }
            else {
                var address = {
                    "addressline": req.session.customerAddress1,
                    "city": req.session.customerState,
                    "pincode": req.session.customerPostcode
                };
                var addresses = [address];
                customerObj = {
                    email: req.session.customerEmail,
                    firstName: req.session.customerFirstname,
                    lastName: req.session.customerLastname,
                    pickupaddress: addresses,
                    phone: req.session.customerPhone,
                    password: bcrypt.hashSync(req.body.shipPassword, 10),
                    created: new Date()
                };
            }
        
           /* const schemaResult = validateJson('newCustomer', customerObj);
            if(!schemaResult.result){
                console.log("validation occur due to deleted some items here");
                res.status(400).json(schemaResult.errors);
                return;
            }*/
        
            // check for existing customer
            const customer =  await db.customers.findOne({ email: req.session.customerEmail });
            if(customer){
                req.session.message = "A customer with that email exist";
                req.seesion.messageType = 'danger';
                return;
            } 
            // email is ok to be used.
            try{
                const newCustomer = await db.customers.insertOne(customerObj);
                indexCustomers(req.app)
                .then(async () => {
                    // Return the new customer
                    const customerReturn = newCustomer.ops[0];
                    delete customerReturn.password;
        
                    // Set the customer into the session
                    req.session.customerPresent = true;
                    req.session.customerId = customerReturn._id;
                    req.session.customerEmail = customerReturn.email;
                    req.session.customerPhone = customerReturn.phone;
                    if(customerReturn.firstName){
                        req.session.customerFirstname = customerReturn.firstName;
                        req.session.customerLastname = customerReturn.lastName;
                        req.session.customerAddress1 = customerReturn.address1;
                        req.session.customerState = customerReturn.state;
                        req.session.customerPostcode = customerReturn.postcode;
                    }
                //    req.session.orderComment = req.body.orderComment;
    
                    // Return customer oject

                    const db = req.app.db;

                    const customer = await db.customers.findOne({ email: mongoSanitize(req.session.customerEmail ) });
                    // check if customer exists with that email
                    if(customer === undefined || customer === null){
                        res.status(400).json({
                            message: 'A customer with that email does not exist.'
                        });
                        return;
                    }
                    // we have a customer under that email so we compare the password
                    bcrypt.compare(req.body.shipPassword, customer.password)
                    .then((result) => {
                        if(!result){
                            // password is not correct
                            res.status(400).json({
                                message: 'Access denied. Check password and try again.'
                            });
                            return;
                        }
                        if(originalUrl){
                            res.redirect(originalUrl);
                            return;
                        }
                          res.redirect('/checkout/information');
                          return;
                    })
                    .catch((err) => {
                        res.status(400).json({
                            message: 'Access denied. Check password and try again.'
                        });
                    });
                });
            }catch(ex){
                console.error(colors.red('Failed to insert customer: ', ex));
                res.status(400).json({
                    message: 'Customer creation failed.'
                });
            }
            } else {
              res.status(401).send(result.error_text);
              if(originalUrl){
                res.redirect(originalUrl);
                return;
            }
              res.redirect('/checkout/information');
              return;
            }
	});
});


//*************************************//

// insert a customer
router.post('/customer/create', async (req, res) => {
    const db = req.app.db;
    var add1 = {
        "addressline": req.body.address1,
        "city": req.body.state,
        "pincode": req.body.postcode
    }
    var pickupaddress = [add1];
    const customerObj = {
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        pickupaddress: pickupaddress,
        phone: req.body.phone,
        password: bcrypt.hashSync(req.body.password, 10),
        created: new Date()
    };

    const schemaResult = validateJson('newCustomer', customerObj);
    if(!schemaResult.result){
        res.status(400).json(schemaResult.errors);
        return;
    }

    // check for existing customer
    const customer = await db.customers.findOne({ email: req.body.email });
    if(customer){
        res.status(400).json({
            message: 'A customer already exists with that email address'
        });
        return;
    }
    // email is ok to be used.
    try{
        const newCustomer = await db.customers.insertOne(customerObj);
        indexCustomers(req.app)
        .then(() => {
            // Return the new customer
            const customerReturn = newCustomer.ops[0];
            delete customerReturn.password;

            // Set the customer into the session
            req.session.customerPresent = true;
            req.session.customerId = customerReturn._id;
            req.session.customerEmail = customerReturn.email;
            req.session.customerCompany = customerReturn.company;
            req.session.customerFirstname = customerReturn.firstName;
            req.session.customerLastname = customerReturn.lastName;
            req.session.customerAddress1 = customerReturn.address1;
            req.session.customerState = customerReturn.city;
            req.session.customerPostcode = customerReturn.postcode;
            req.session.customerPhone = customerReturn.phone;
            req.session.orderComment = req.body.orderComment;

            // Return customer oject
            res.status(200).json(customerReturn);
        });
    }catch(ex){
        console.error(colors.red('Failed to insert customer: ', ex));
        res.status(400).json({
            message: 'Customer creation failed.'
        });
    }
});

router.post('/customer/save', async (req, res) => {
    const customerObj = {
        email: req.body.email,
        company: req.body.company,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        address1: req.body.address1,
        address2: req.body.address2,
        country: req.body.country,
        state: req.body.state,
        postcode: req.body.postcode,
        phone: req.body.phone
    };

    const schemaResult = validateJson('saveCustomer', customerObj);
    if(!schemaResult.result){
        res.status(400).json(schemaResult.errors);
        return;
    }

    // Set the customer into the session
    req.session.customerPresent = true;
    req.session.customerEmail = customerObj.email;
    req.session.customerCompany = customerObj.company;
    req.session.customerFirstname = customerObj.firstName;
    req.session.customerLastname = customerObj.lastName;
    req.session.customerAddress1 = customerObj.address1;
    req.session.customerAddress2 = customerObj.address2;
    req.session.customerCountry = customerObj.country;
    req.session.customerState = customerObj.state;
    req.session.customerPostcode = customerObj.postcode;
    req.session.customerPhone = customerObj.phone;
    req.session.orderComment = req.body.orderComment;

    res.status(200).json(customerObj);
});

// Get customer orders
router.get('/customer/account/:page?', async (req, res) => {
    const db = req.app.db;
    const config = req.app.config;

    if(!req.session.customerPresent){
        res.redirect('/customer/login');
        return;
    }

    const orders = await db.orders.find({
     $or: [ { orderCustomer: getId(req.session.customerId) }, {orderCustomer: String(req.session.customerId)}]
    })
    .sort({ orderDate: -1 })
    .toArray();
   
    const customerArray = await db.customers.findOne({
        email: req.session.customerEmail})
    
        
    var page = '';
    if(req.params.page){
        page = req.params.page;
    }
    
    res.render(`${config.themeViews}customer-account`, {
        title: 'Orders',
        session: req.session,
        categories: req.app.categories,
        orders: orders,
        customerArray:customerArray,
        page: page,
        showFooter: "ShowFooter",
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        countryList: getCountryList(),
        config: req.app.config,
        helpers: req.handlebars.helpers
    });
});

// Update a customer
router.post('/customer/update', async (req, res) => {
    const db = req.app.db;

    if(!req.session.customerPresent){
        res.redirect('/customer/login');
        return;
    }

    const customer = await db.customers.findOne({ _id: getId(req.session.customerId) });
    var newpassww = '';
    if(req.body.password && req.body.password1) {
        if(req.body.password == req.body.password1){
            newpassww = bcrypt.hashSync(req.body.password, 10);
        }
        else{
            console.log('errors ! Password does not match');
            res.status(400).json("Password does not match");
            return;
        }
    }
    else{
        newpassww = customer.password;
    }
    
    var customerObj = {
        password: newpassww
    };
    if(req.body.email){
        customerObj['email'] = req.body.email;
        customerObj['phone'] = req.body.phone;
        customerObj['address1'] = req.session.customerAddress1;
        customerObj['country'] = req.session.customerCountry;
        customerObj['state'] = req.session.customerState;
        customerObj['postcode'] = req.session.customerPostcode;
        customerObj['phone'] = req.session.customerPhone;
    }
    else if(req.body.address1){
        customerObj['email'] = req.session.customerEmail;
        customerObj['firstName'] = req.session.customerFirstname;
        customerObj['lastName'] = req.session.customerLastname;

        customerObj['address1'] = req.body.address1;
        customerObj['country'] = req.body.country;
        customerObj['state'] = req.body.state;
        customerObj['postcode'] = req.body.postcode;
        customerObj['phone'] = req.body.phone;
    }

   /* const schemaResult = validateJson('editCustomer', customerObj);
    if(!schemaResult.result){
        console.log('errors', schemaResult.errors);
        res.status(400).json(schemaResult.errors);
        return;
    } */

    // check for existing customer
    if(!customer){
        res.status(400).json({
            message: 'Customer not found'
        });
        return;
    }
    // Update customer
    try{
        const updatedCustomer = await db.customers.findOneAndUpdate(
            { _id: getId(req.session.customerId) },
            {
                $set: customerObj
            }, { multi: false, returnOriginal: false }
        );
        indexCustomers(req.app)
        .then(() => {
            // Set the customer into the session
            req.session.customerEmail = customerObj.email;
            req.session.customerCompany = customerObj.company;
            req.session.customerFirstname = customerObj.firstName;
            req.session.customerLastname = customerObj.lastName;
            req.session.customerAddress1 = customerObj.address1;
            req.session.customerAddress2 = customerObj.address2;
            req.session.customerCountry = customerObj.country;
            req.session.customerState = customerObj.state;
            req.session.customerPostcode = customerObj.postcode;
            req.session.customerPhone = customerObj.phone;
            req.session.orderComment = req.body.orderComment;

            res.status(200).json({ message: 'Customer updated', customer: updatedCustomer.value });
        });
    }catch(ex){
        console.error(colors.red('Failed updating customer: ' + ex));
        res.status(400).json({ message: 'Failed to update customer' });
    }
});

// Update a customer
router.post('/admin/customer/update', restrict, async (req, res) => {
    const db = req.app.db;

    const customerObj = {
        company: req.body.company,
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        address1: req.body.address1,
        address2: req.body.address2,
        country: req.body.country,
        state: req.body.state,
        postcode: req.body.postcode,
        phone: req.body.phone
    };

    // Handle optional values
    if(req.body.password){ customerObj.password = bcrypt.hashSync(req.body.password, 10); }

    const schemaResult = validateJson('editCustomer', customerObj);
    if(!schemaResult.result){
        console.log('errors', schemaResult.errors);
        res.status(400).json(schemaResult.errors);
        return;
    }

    // check for existing customer
    const customer = await db.customers.findOne({ _id: getId(req.body.customerId) });
    if(!customer){
        res.status(400).json({
            message: 'Customer not found'
        });
        return;
    }
    // Update customer
    try{
        const updatedCustomer = await db.customers.findOneAndUpdate(
            { _id: getId(req.body.customerId) },
            {
                $set: customerObj
            }, { multi: false, returnOriginal: false }
        );
        indexCustomers(req.app)
        .then(() => {
            const returnCustomer = updatedCustomer.value;
            delete returnCustomer.password;
            res.status(200).json({ message: 'Customer updated', customer: updatedCustomer.value });
        });
    }catch(ex){
        console.error(colors.red('Failed updating customer: ' + ex));
        res.status(400).json({ message: 'Failed to update customer' });
    }
});

// Delete a customer
router.delete('/admin/customer', restrict, async (req, res) => {
    const db = req.app.db;

    // check for existing customer
    const customer = await db.customers.findOne({ _id: getId(req.body.customerId) });
    if(!customer){
        res.status(400).json({
            message: 'Failed to delete customer. Customer not found'
        });
        return;
    }
    // Update customer
    try{
        await db.customers.deleteOne({ _id: getId(req.body.customerId) });
        indexCustomers(req.app)
        .then(() => {
            res.status(200).json({ message: 'Customer deleted' });
        });
    }catch(ex){
        console.error(colors.red('Failed deleting customer: ' + ex));
        res.status(400).json({ message: 'Failed to delete customer' });
    }
});

// render the customer view
router.get('/admin/customer/view/:id?', restrict, async (req, res) => {
    const db = req.app.db;

    const customer = await db.customers.findOne({ _id: getId(req.params.id) });

    if(!customer){
         // If API request, return json
        if(req.apiAuthenticated){
            return res.status(400).json({ message: 'Customer not found' });
        }
        req.session.message = 'Customer not found';
        req.session.message_type = 'danger';
        return res.redirect('/admin/customers');
    }

    // If API request, return json
    if(req.apiAuthenticated){
        return res.status(200).json(customer);
    }

    return res.render('customer', {
        title: 'View customer',
        result: customer,
        admin: true,
        session: req.session,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        countryList: getCountryList(),
        config: req.app.config,
        editor: true,
        helpers: req.handlebars.helpers
    });
});

// customers list
router.get('/admin/customers', restrict, async (req, res) => {
    const db = req.app.db;

    const customers = await db.customers.find({}).limit(20).sort({ created: -1 }).toArray();

    // If API request, return json
    if(req.apiAuthenticated){
        return res.status(200).json(customers);
    }

    return res.render('customers', {
        title: 'Customers - List',
        admin: true,
        customers: customers,
        session: req.session,
        helpers: req.handlebars.helpers,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        config: req.app.config
    });
});

// Filtered customers list
router.get('/admin/customers/filter/:search', restrict, async (req, res, next) => {
    const db = req.app.db;
    const searchTerm = req.params.search;
    const customersIndex = req.app.customersIndex;

    const lunrIdArray = [];
    customersIndex.search(searchTerm).forEach((id) => {
        lunrIdArray.push(getId(id.ref));
    });

    // we search on the lunr indexes
    const customers = await db.customers.find({ _id: { $in: lunrIdArray } }).sort({ created: -1 }).toArray();

    // If API request, return json
    if(req.apiAuthenticated){
        return res.status(200).json({
            customers
        });
    }

    return res.render('customers', {
        title: 'Customer results',
        customers: customers,
        admin: true,
        config: req.app.config,
        session: req.session,
        searchTerm: searchTerm,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers
    });
});

router.post('/admin/customer/lookup', restrict, async (req, res, next) => {
    const db = req.app.db;
    const customerEmail = req.body.customerEmail;

    // Search for a customer
    const customer = await db.customers.findOne({ email: customerEmail });

    if(customer){
        req.session.customerPresent = true;
        req.session.customerId = customer._id;
        req.session.customerEmail = customer.email;
        req.session.customerCompany = customer.company;
        req.session.customerFirstname = customer.firstName;
        req.session.customerLastname = customer.lastName;
        req.session.customerAddress1 = customer.address1;
        req.session.customerAddress2 = customer.address2;
        req.session.customerCountry = customer.country;
        req.session.customerState = customer.state;
        req.session.customerPostcode = customer.postcode;
        req.session.customerPhone = customer.phone;

        return res.status(200).json({
            message: 'Customer found',
            customer
        });
    }
    return res.status(400).json({
        message: 'No customers found'
    });
});

router.get('/customer/login', async (req, res, next) => {
    const config = req.app.config;

    res.render(`${config.themeViews}customer-login`, {
        title: 'Customer login',
        config: req.app.config,
        session: req.session,
        categories: req.app.categories,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers
    });
});

// Extra Pages
router.get('/customer/contact', async (req, res, next) => {
    const config = req.app.config;

    res.render(`${config.themeViews}customer-contact`, {
        title: 'Contact',
        config: req.app.config,
        session: req.session,
        categories: req.app.categories,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: true
    });
});
router.get('/customer/aboutus', async (req, res, next) => {
    const config = req.app.config;

    res.render(`${config.themeViews}aboutus`, {
        title: 'About Us',
        config: req.app.config,
        session: req.session,
        categories: req.app.categories,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: true
    });
});
router.get('/customer/forgot-password', async (req, res, next) => {
    const config = req.app.config;

    res.render(`${config.themeViews}customer-forgot-password`, {
        title: 'Forgot Password',
        config: req.app.config,
        session: req.session,
        categories: req.app.categories,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: true
    });
});

router.get('/customer/privacy', (req, res) => {
    const config = req.app.config;

    res.render(`${config.themeViews}privacy`, {
      title: 'Privacy Policy',
      page: req.query.path,
      config,
      session: req.session,
      categories: req.app.categories,
      message: clearSessionValue(req.session, 'message'),
      messageType: clearSessionValue(req.session, 'messageType'),
      helpers: req.handlebars.helpers,
      showFooter: 'showFooter'
    });
});

router.get('/customer/delivery', (req, res) => {
    const config = req.app.config;

    res.render(`${config.themeViews}delivery`, {
      title: 'Delivery Information',
      page: req.query.path,
      config,
      session: req.session,
      categories: req.app.categories,
      message: clearSessionValue(req.session, 'message'),
      messageType: clearSessionValue(req.session, 'messageType'),
      helpers: req.handlebars.helpers,
      showFooter: 'showFooter'
    });
});
router.post('/customer/slotchange', (req, res) =>{
    req.session.slotdate = req.body.datepicker;
    req.session.slottime = req.body.slottime;
    req.session.vehicleNumber = req.body.vehicleNumber;
    res.redirect('/checkout/information');
});
router.post('/customer/usepickaddress',async (req, res)=>{
    const db = req.app.db;
    var customer = await db.customers.findOne({_id: getId(req.body.customerId)});
    if(!customer){
        res.status(400).json({message: "Customer Does not exist"});
        return;
    }

    if(customer.pickupaddress[req.body.id]){
        req.session.customerpickaddress = customer.pickupaddress[req.body.id].addressline;
        req.session.customerpickcity = customer.pickupaddress[req.body.id].city;
        req.session.customerpickpostcode = customer.pickupaddress[req.body.id].pincode;
        req.session.customerpickname = customer.pickupaddress[req.body.id].name;
        req.session.customerpickphone = customer.pickupaddress[req.body.id].phone;
        req.session.pickupAlternate = customer.pickupaddress[req.body.id].pickupAlternate;
        res.status(200).json({message: "Pick Up Address Selected"});
        return;
    }
    else {
        res.status(400).json({message: "Pick Up Address Does not exist"});
        return;
    }
});
router.post('/customer/usedropaddress',async (req, res)=>{
    const db = req.app.db;
    var customer = await db.customers.findOne({_id: getId(req.body.customerId)});
    if(!customer){
        res.status(400).json({message: "Customer Does not exist"});
        return;
    }
    if(customer.dropupaddress[req.body.id]){
        req.session.customerdropaddress = customer.dropupaddress[req.body.id].addressline;
        req.session.customerdropcity = customer.dropupaddress[req.body.id].city;
        req.session.customerdroppostcode = customer.dropupaddress[req.body.id].pincode;
        req.session.customerdropname = customer.dropupaddress[req.body.id].name;
        req.session.customerdropphone = customer.dropupaddress[req.body.id].phone;
        req.session.dropupAlternate = customer.dropupaddress[req.body.id].alternatePhone;
        res.status(200).json({message: "Drop Adress Selected"});
        return;
    } 
    else {
        res.status(400).json({message: "Drop Address Does not exist"});
        return;
    }
});

router.get('/customer/userEditPick/:id',async (req, res)=>{
    const db = req.app.db;
    const config = req.app.config;
    var  addressline,city,name,pincode,phone;
    var dataValue;

    dataValue = req.params.id;

    var customer = await db.customers.findOne({_id: getId(req.session.customerId)});

    if(!customer){
        res.status(400).json({message: "Customer Does not exist"});
        return;
    }
    if(customer.pickupaddress[req.params.id]){
        addressline = customer.pickupaddress[req.params.id].addressline;
        city = customer.pickupaddress[req.params.id].city;
        pincode = customer.pickupaddress[req.params.id].pincode;
        name = customer.pickupaddress[req.params.id].name;
        phone = customer.pickupaddress[req.params.id].phone;
    } 
    else {
        res.status(400).json({message: "Drop Address Does not exist"});
        return;
    }
    res.render(`${config.themeViews}customer-profile-pick-edit`, {
        title: 'customer-profile-pick-edit',
        config,
        addressline:addressline,
        dataValue:dataValue,
        city:city,
        pincode:pincode,
        name:name,
        phone:phone,
        session: req.session,
        categories: req.app.categories,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: 'showFooter'
      });
});

router.get('/customer/userEditDrop/:id',async (req, res)=>{
    const db = req.app.db;
    const config = req.app.config;
    var  addressline,city,name,pincode,phone;
    var dataValue;

    dataValue = req.params.id;

    var customer = await db.customers.findOne({_id: getId(req.session.customerId)});

    if(!customer){
        res.status(400).json({message: "Customer Does not exist"});
        return;
    }
    if(customer.dropupaddress[req.params.id]){
        addressline = customer.dropupaddress[req.params.id].addressline;
        city = customer.dropupaddress[req.params.id].city;
        pincode = customer.dropupaddress[req.params.id].pincode;
        name = customer.dropupaddress[req.params.id].name;
        phone = customer.dropupaddress[req.params.id].phone;
    } 
    else {
        res.status(400).json({message: "Drop Address Does not exist"});
        return;
    }
    res.render(`${config.themeViews}customer-profile-drop-edit`, {
        title: 'customer-profile-drop-edit',
        config,
        addressline:addressline,
        dataValue:dataValue,
        city:city,
        pincode:pincode,
        name:name,
        phone:phone,
        session: req.session,
        categories: req.app.categories,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: 'showFooter'
      });
});

router.post('/customer/userEditPick/submit',async (req, res)=>{
    const db = req.app.db;
    const config = req.app.config;
    const customer = await db.customers.findOne({ _id: getId(req.session.customerId) });

    var customerObj={};
    var address = {
        "name":req.body.namedrop,
        "phone":req.body.phonedrop,
        "addressline": req.body.adddrop,
        "city": req.body.citydrop,
        "pincode": req.body.pindrop
    };
    customerObj.pickupaddress = customer.pickupaddress;
    customerObj.pickupaddress[req.body.customerId] = address;

    console.log(req.body.namedrop);
    console.log(req.body.phonedrop);
    console.log(req.body.adddrop);
    console.log(req.body.citydrop);
    console.log(req.body.pindrop);

    try{
        const updatedCustomer = await db.customers.findOneAndUpdate(
            { _id: getId(req.session.customerId) },
            {
                $set: customerObj
            }, { multi: false, returnOriginal: false }
        )
        .then(() => {
            // Set the customer into the session
            res.redirect('/customer/account');
        });
    }catch(ex){
        console.error(colors.red('Failed updating customer: '));
        res.status(400).json({ message: 'Failed to update ' });
    }
   });

   router.post('/customer/userEditDrop/submit',async (req, res)=>{
    const db = req.app.db;
    const config = req.app.config;
    const customer = await db.customers.findOne({ _id: getId(req.session.customerId) });

    var customerObj={};
    var address = {
        "name":req.body.namedrop,
        "phone":req.body.phonedrop,
        "addressline": req.body.adddrop,
        "city": req.body.citydrop,
        "pincode": req.body.pindrop
    };
    customerObj.dropupaddress = customer.dropupaddress;
    customerObj.dropupaddress[req.body.customerId] = address;

    console.log(req.body.pindrop);

    try{
        const updatedCustomer = await db.customers.findOneAndUpdate(
            { _id: getId(req.session.customerId) },
            {
                $set: customerObj
            }, { multi: false, returnOriginal: false }
        )
        .then(() => {
            // Set the customer into the session
            res.redirect('/customer/account');
        });
    }catch(ex){
        console.error(colors.red('Failed updating customer: '));
        res.status(400).json({ message: 'Failed to update ' });
    }
   });

   router.post('/customer/deleteaddress/pickup',async (req,res)=>{
    const db = req.app.db;
    var customer = await db.customers.findOne({_id: getId(req.session.customerId)});
    if(!customer){
        req.session.message = "Customer Does not exist";
        req.session.messageType = "danger";
        res.redirect('/customer/login');
        return;
    }
    if(customer.pickupaddress.length <= req.body.id) {
        req.session.message = "Address Not Found";
        req.session.messageType = "danger";
        res.redirect('/customer/account');
        return;
    }
    if(req.session.customerId && req.body.id){
        await db.customers.findOneAndUpdate({_id: getId(req.session.customerId)},{$pull: {pickupaddress: customer.pickupaddress[req.body.id]}}); 
        req.session.message = "Address Deleted Successfull";
        req.session.messageType = "success";
        res.redirect('/customer/account');
        return;
    }
});

router.post('/customer/deleteaddress/dropup',async (req,res)=>{
    const db = req.app.db;
    var customer = await db.customers.findOne({_id: getId(req.session.customerId)});
    if(!customer){
        req.session.message = "Customer Does not exist";
        req.session.messageType = "danger";
        res.redirect('/customer/login');
        return;
    }
    if(customer.dropupaddress.length <= req.body.id) {
        req.session.message = "Address Not Found";
        req.session.messageType = "danger";
        res.redirect('/customer/account');
        return;
    }
    if(req.session.customerId && req.body.id){
        await db.customers.findOneAndUpdate({_id: getId(req.session.customerId)},{$pull: {dropupaddress: customer.dropupaddress[req.body.id]}}); 
        req.session.message = "Address Deleted Successfull";
        req.session.messageType = "success";
        res.redirect('/customer/account');
        return;
    }
});


router.get('/customer/terms', (req, res) => {
    const config = req.app.config;

    res.render(`${config.themeViews}terms`, {
      title: 'Terms & Conditions',
      page: req.query.path,
      config,
      session: req.session,
      categories: req.app.categories,
      message: clearSessionValue(req.session, 'message'),
      messageType: clearSessionValue(req.session, 'messageType'),
      helpers: req.handlebars.helpers,
      showFooter: 'showFooter'
    });
});

// login the customer and check the password
router.post('/customer/login_action', async (req, res) => {
    const db = req.app.db;
    
    const customer = await db.customers.findOne({ phone: mongoSanitize(req.body.loginPhone) });
    // check if customer exists with that email
    if(customer === undefined || customer === null){
        res.status(400).json({
            message: 'A customer with that phone does not exist.'
        });
        return;
    }
    // we have a customer under that email so we compare the password
    bcrypt.compare(req.body.loginPassword, customer.password)
    .then((result) => {
        if(!result){
            // password is not correct
            res.status(400).json({
                message: 'Access denied. Check password and try again.'
            });
            return;
        }

        // Customer login successful
        req.session.customerPresent = true;
        req.session.customerId = customer._id;
        req.session.customerEmail = customer.email;
        req.session.customerCompany = customer.company;
        req.session.customerFirstname = customer.firstName;
        req.session.customerLastname = customer.lastName;
        req.session.customerAddress1 = customer.address1;
        req.session.customerAddress2 = customer.address2;
        req.session.customerCountry = customer.country;
        req.session.customerState = customer.state;
        req.session.customerPostcode = customer.postcode;
        req.session.customerPhone = customer.phone;

        res.status(200).json({
            message: 'Successfully logged in',
            customer: customer
        });
    })
    .catch((err) => {
        res.status(400).json({
            message: 'Access denied. Check password and try again.'
        });
    });
});

// customer forgotten password
router.get('/customer/forgotten', (req, res) => {
    res.render('forgotten', {
        title: 'Forgotten',
        route: 'customer',
        forgotType: 'customer',
        config: req.app.config,
        categories: req.app.categories,
        helpers: req.handlebars.helpers,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        showFooter: 'showFooter'
    });
});

// forgotten password
router.post('/customer/forgotten_action', apiLimiter, async (req, res) => {
    const db = req.app.db;
    const config = req.app.config;
    const passwordToken = randtoken.generate(30);

    // find the user
    const customer = await db.customers.findOne({ email: req.body.email });
    try{
        if(!customer){
            // if don't have an email on file, silently fail
            res.status(200).json({
                message: 'If your account exists, a password reset has been sent to your email'
            });
            return;
        }
        const tokenExpiry = Date.now() + 3600000;
        await db.customers.updateOne({ email: req.body.email }, { $set: { resetToken: passwordToken, resetTokenExpiry: tokenExpiry } }, { multi: false });
        // send forgotten password email
        /*const mailOpts = {
            to: req.body.email,
            subject: 'Forgotten password request',
            body: `You are receiving this because you (or someone else) have requested the reset of the password for your user account.\n\n
                Please click on the following link, or paste this into your browser to complete the process:\n\n
                ${config.baseUrl}/customer/reset/${passwordToken}\n\n
                If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };

        // send the email with token to the user
        // TODO: Should fix this to properly handle result */
       // sendEmail(mailOpts.to, mailOpts.subject, mailOpts.body);
            const html=`You are receiving this because you (or someone else) have requested the reset of the password for your user account.\n\n
            Please click on the following link, or paste this into your browser to complete the process:\n\n
            ${config.baseUrl}/customer/reset/${passwordToken}\n\n
            If you did not request this, please ignore this email and your password will remain unchanged.\n`;
        await mailer.sendEmail('Customer@plant4u.com',req.body.email,'Forgotten password request',html)
        res.status(200).json({
            message: 'If your account exists, a password reset has been sent to your email'
        });
    }catch(ex){
        console.log(ex);
        res.status(400).json({
            message: 'Password reset failed.'
        });
    }
});

// reset password form
router.get('/customer/reset/:token', async (req, res) => {
    const db = req.app.db;
    const config = req.app.config;
    // Find the customer using the token
    const customer = await db.customers.findOne({ resetToken: req.params.token, resetTokenExpiry: { $gt: Date.now() } });
    if(!customer){
        req.session.message = 'Password reset token is invalid or has expired';
        req.session.message_type = 'danger';
        res.redirect('/forgot');
        return;
    }

    // show the password reset form
    res.render(`${config.themeViews}customer-password-reset`, {
        title: 'Reset password',
        token: req.params.token,
        route: 'customer',
        config: req.app.config,
        categories: req.app.categories,
        message: clearSessionValue(req.session, 'message'),
        message_type: clearSessionValue(req.session, 'message_type'),
        show_footer: 'show_footer',
        helpers: req.handlebars.helpers
    });
});

// reset password action
router.post('/customer/reset/:token', async (req, res) => {
    const db = req.app.db;

    // get the customer
    const customer = await db.customers.findOne({ resetToken: req.params.token, resetTokenExpiry: { $gt: Date.now() } });
    if(!customer){
        req.session.message = 'Password reset token is invalid or has expired';
        req.session.message_type = 'danger';
        res.redirect('/customer/forgot');
        return;
    }
    if(req.body.password[0] != req.body.password[1]) {
        if(!customer){
            req.session.message = 'Password Not Matched';
            req.session.message_type = 'danger';
            res.redirect('/customer/forgot');
            return;
        }
    }

    // update the password and remove the token
    const newPassword = bcrypt.hashSync(req.body.password[0], 10);
    try{
        await db.customers.updateOne({ email: customer.email }, { $set: { password: newPassword, resetToken: undefined, resetTokenExpiry: undefined } }, { multi: false });
        const mailOpts = {
            to: customer.email,
            subject: 'Password successfully reset',
            body: 'This is a confirmation that the password for your account ' + customer.email + ' has just been changed successfully.\n'
        };

        // TODO: Should fix this to properly handle result
        // sendEmail(mailOpts.to, mailOpts.subject, mailOpts.body);
        req.session.message = 'Password successfully updated';
        req.session.message_type = 'success';
        return res.redirect('/customer/login');
    }catch(ex){
        console.log('Unable to reset password', ex);
        req.session.message = 'Unable to reset password';
        req.session.message_type = 'danger';
        return res.redirect('/customer/forgot-password');
    }
});

// logout the customer
router.post('/customer/logout', (req, res) => {
    // Clear our session
    clearCustomer(req);
    res.status(200).json({});
});

// logout the customer
router.get('/customer/logout', (req, res) => {
    // Clear our session
    clearCustomer(req);
    res.redirect('/customer/login');
});

module.exports = router;
