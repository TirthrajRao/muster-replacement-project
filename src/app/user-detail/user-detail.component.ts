import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup , FormControl, Validators } from '@angular/forms';
import * as moment from 'moment';

import { UserService } from '../services/user.service';
import { LogsService }  from '../services/logs.service';
import { LoginService } from '../services/login.service';
declare var $;
@Component({
	selector: 'app-user-detail',
	templateUrl: './user-detail.component.html',
	styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent implements OnInit {
	userId : any;
	totalHoursToWork :any;
	totalHoursWorked :any;
	searchForm:FormGroup;
	isDisable:boolean =false;
	userInfo : any;
	currentUserDetail : any;
	fiveDaysLogs: any;
	p: number = 1;
	data = {
		firstDate : "",
		secondDate : "",
	};
	//imported
	modelValue;
	previousData : any;
	logs : any;
	flag = false;
	getLogsBySingleDate = false;
	getLogsBetweenDates = false;
	search = false;
	constructor(
		private activatedRoute: ActivatedRoute,
		private router: Router,
		private _userService: UserService,
		private _logService: LogsService,
		private _loginService: LoginService
	){
		this.searchForm = new FormGroup({
			fromDate:new FormControl(''),
			toDate: new FormControl('')
		});
		this.userInfo  = JSON.parse(localStorage.getItem("currentUser"));
		this.userId = this.activatedRoute.snapshot.paramMap.get('id');
		console.log(this.userId);
	}

	ngOnInit() {
		// this.getMACAddress();
		var self = this;
		$(document).ready(function(){
			
				// alert("The input clicked was clicked.");
				$(function() {

					var start = moment().subtract(29, 'days');
					var end = moment();

					function cb(start, end) {
						self.getRangeDate(start, end);
					}

					$('#reportrange').daterangepicker({
						startDate: start,
						endDate: end,
						ranges: {
							'Today': [moment(), moment()],
							'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
							'Last 7 Days': [moment().subtract(6, 'days'), moment()],
							'Last 30 Days': [moment().subtract(29, 'days'), moment()],
							'This Month': [moment().startOf('month'), moment().endOf('month')],
							'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
						}
					}, cb);

					cb(start, end);

				});
			
		});
		$(document).ready(function(){
			$('[data-toggle="tooltip"]').tooltip();   
		});
		$( function() {
			$("#firstDate").datepicker();
		});
		$( function() {
			$("#secondDate").datepicker();
		});
		this.getUserById();
		this.getInitialRecord();
	}
	get f() { return this.searchForm.controls; }
	getUserById(){
		this._userService.getUserById(this.userId).subscribe((res) => {
			console.log("resposne of singleUser" , res); 
			this.currentUserDetail = res;
		} , (err) => {
			console.log("error of singleUser" , err); 
		});
	}
	toDate(value){
		console.log(value , this.searchForm.value);
		this.isDisable =false;
	}
	getInitialRecord(){
		this.search = false;
		this._logService.getLastFiveDaysAttendance(this.userId).subscribe(async (response) => {
			console.log("last five days response" , response);
			await this.properFormatDate(response);
			this.fiveDaysLogs = response;
			await this.calculateTotalDuration(this.fiveDaysLogs , 5);
		} ,(err) => {
			console.log("last five days error" , err);
		});
	}
	resetForm(){
		this.search = false;
		(<HTMLInputElement>document.getElementById("reportrange")).value = "";
	}
	openModel(index){
		console.log("hey" , index);
		if(!this.search)
			this.modelValue = this.fiveDaysLogs[index];
		else{
			console.log("this.todaysAttendance in else ====>" , this.logs);
			this.modelValue = this.logs[index];
		}
		console.log(this.modelValue);
		$('#myModal').modal('show');
	}
	getRangeDate(start, end){
		if(this.fiveDaysLogs){
		console.log(" date " ,new Date(start._d).toISOString() , new Date(end._d).toISOString());
		var body = {
			userId : this.userId,
			startDate : new Date(start._d).toISOString(),
			endDate : new Date(end._d).toISOString()
		}
			this.search = true;
			this._logService.getLogsReportById(body).subscribe((res)=>{
				console.log("response of getLogsReportById" , res);
				this.logs = this.properFormatDate(res);
				//calculate the total duration
				var startDate = moment(start._d);
  				var endDate = moment(end._d);  
				var resultHours = endDate.diff(startDate, 'days', true);
				console.log("resultHours =====================++>" , resultHours);
				this.calculateTotalDuration(this.logs , resultHours);
			} , (err)=>{
				console.log("err of getLogsReportById" , err);
			});
		}
	}
	logout() {
		console.log("logiut ccalled");
		this._loginService.logout();
		this.router.navigate(['login']);
	}
// 	getMACAddress() {
// 		require('getmac').getMac(function (err, macAddress) {
// 			if (err) throw err
// 				console.log(macAddress)
// 			alert(macAddress);
// 		})
// }
	calculateTotalDuration(array , resultHours){
		var workingHours = 0;
		var totalHours = 0;
		for(var i = 0 ; i< Math.ceil(resultHours) ; i++){
			totalHours = totalHours + 30600; 
		}
		array.forEach((obj)=>{
			// console.log(obj);
			if(obj.diffrence){
				workingHours = workingHours + moment.duration(obj.diffrence).asSeconds();
				console.log("workingHours ====>" , workingHours);
			}
		});
		//calculate total working hours 
		var minutes = Math.floor(totalHours / 60);
		totalHours = totalHours%60;
		var hours = Math.floor(minutes/60)
		minutes = minutes%60;
		console.log("totalHours ====>" , hours , minutes);
		this.totalHoursToWork =  hours+":"+minutes+":"+"00";
		//calculate hours worked 
		
		var minutes = Math.floor(workingHours / 60);
		workingHours = workingHours%60;
		var hours = Math.floor(minutes/60)
		minutes = minutes%60;
		this.totalHoursWorked = hours+":"+minutes+":"+"00";
		console.log("total hours attednent ====>" , this.totalHoursToWork);
		console.log("total hours to attendnace====>" , this.totalHoursWorked);

	}
	properFormatDate(data){
		return data = data.filter((obj)=>{
			// console.log("Before date =======>" , obj.date);
			obj.date = moment(obj.date).utc().format("DD/MM/YYYY");
			// console.log("after date =======>" , obj.date);
			return obj.date;
		});
	}
}
