import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Character } from './model/api-models';
import { URLS } from './utils/constants';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

	httpClient : HttpClient;
	
	title : string = 'outsiders-arena-ui';

  constructor(httpClient : HttpClient) {
    this.httpClient = httpClient;
  }

  ngOnInit() {

  }


}
