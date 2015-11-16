import PhoneHome from "phonehome";

export default function() {
	let phone = this.phone = new PhoneHome({ url: "/-methods" });
	this.call = phone.call.bind(phone);
	this.apply = phone.apply.bind(phone);
	this.methods = phone.methods.bind(phone);
}
