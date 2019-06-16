import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

/*
  Generated class for the GithubProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class GithubProvider {


  api = 'http://10.30.191.202:8000/';
  testId = 373240762;
  testComment = 432455109;

  constructor(public http: HttpClient) {
    console.log('Hello GithubProvider Provider');
  }

  async postIssue(title, description){
    let body = new FormData();
    body.append('title', title);
    body.append('description', description);
    let resp = this.http.post(this.api + 'issue', body).toPromise();
  }

  async getIssues(){
    let resp = this.http.get(this.api + 'issue').toPromise();
    return resp;
  }

  async getIssuesById(id){
    if (!id || id === null){
      id = this.testId;
    }
    let resp = this.http.get(this.api + 'issue/' + id).toPromise();
    return resp;
  }

  async getComments(){
    let resp = this.http.get(this.api + 'issue/comments').toPromise();
    return resp;
  }

  async postComment(id, comment){
    let body = new FormData();
    body.append('body', comment);    

    if (!id || id === null){
      id = this.testId;
    }

    let resp = this.http.post(this.api + 'issue/comments/' + id, body).toPromise();
    return resp;
  }

  async postUser(userId){
    let resp: any = await this.http.get(this.api + 'issue/comments/1/' + userId).toPromise();
    // parse the json
    resp = JSON.parse(resp.body.replace('<!---', '').replace('-->', ''));
    resp.imageUrl = "https://pod51243.outlook.com/owa/service.svc/s/GetPersonaPhoto?email="+resp.user_id+"@dow.com&amp;UA=0&amp;size=HR64x64&amp;sc=1540347918922";
    return resp;
  }


}
