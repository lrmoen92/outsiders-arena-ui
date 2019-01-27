import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'login-root',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  
	httpClient : HttpClient;

  constructor(httpClient : HttpClient) {
    this.httpClient = httpClient;
  }

  ngOnInit() {

    this.httpClient.get('').subscribe(
      x => {
        console.log(x);
      },
      y => {

      },
      () => {

      }
    );
  }
}
