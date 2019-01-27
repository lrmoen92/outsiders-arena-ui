import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'nav-root',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {
  
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
