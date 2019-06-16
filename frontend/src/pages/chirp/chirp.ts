import { Component, Inject } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform, PopoverController } from 'ionic-angular';
import { GoogleNearby } from '@ionic-native/google-nearby';
import { ToastController } from 'ionic-angular';
import * as moment from 'moment';
import { Attendee } from './../../models/attendee';
import 'rxjs/add/operator/toPromise';
import { GithubProvider } from './../../providers/github/github';

declare let ChirpConnectSDK: any;
declare let d3: any;
declare let $: any;
declare let window: any;

@IonicPage()
@Component({
  selector: 'page-chirp',
  templateUrl: 'chirp.html',
})
export class ChirpPage {

  account;
  name = "";
  attendees;
  attendeeCount = 0;
  nearbySub;
  public attendeeList = [] as Array<Attendee>;
  graph;
  myGraph;
  showCount = false;
  eventName = "";
  issues;
  comments;
  startDate = 0;
  userInfo;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public googleNearby: GoogleNearby,
    public platform: Platform,
    private toastCtrl: ToastController,
    private github : GithubProvider,
    public popoverCtrl: PopoverController
  ) {
    this.registerNearbyLifecycle();
    //let a = {} as Attendee;
    // a.name = 'n';
    // a.time = this.now();
    // a.publicAddress ='this.account.address';
    // this.attendeeList.push(a);
    // this.attendeeList.push({name:'b', time: '1', publicAddress: '11'});
    window.attendees = 0;
    window.attendeeList = [];
  }

  ionViewDidLoad() {
    //this.setupNearby();
    this.chirp();
    window.popoverCtrl = this.popoverCtrl;
  }


  async submitAttendanceListToBlockChain() {
    // ETH
    // https://stackoverflow.com/questions/48184969/calling-smart-contracts-methods-using-web3-ethereum

    // EOS
  }

  ionViewDidLeave() {
    if (this.platform.is('cordova')) {
      this.nearbySub.unsubscribe();
    }
  }

  registerNearbyLifecycle() {
    this.platform.ready().then(() => {
      // When app pauses, unsubscripbe from nearby
      this.platform.pause.subscribe(() => {
        console.log('MessagePage App paused');
        try {
          this.ionViewDidLeave();
        }
        catch (e) { }
      });
      // When app resumes subscribe to nearby
      this.platform.resume.subscribe(() => {
        console.log('MessagePage App resume');
        this.setupNearby();
      });
    });
  }

  setupNearby() {
    this.toast('Listening for nearby attendees...');
    if (this.platform.is('cordova')) {
      // Get Data
      this.nearbySub = this.googleNearby.subscribe().subscribe(result => {
        result = result.replace(/\\/g, "");
        result = result.substring(1, result.length - 1);
        console.log(result);
        this.toast(result);
        let a = JSON.parse(result);
        // this.bal = this.bal + 1;
        // localStorage.setItem('bal', this.bal.toString());
        this.attendeeList.push(a);
      });
    }
  }

  sendAttendanceGossip() {

    if (this.name !== "") {
      localStorage.setItem('name', this.name);
    }

    let attendee = {
      name: this.name,
      time: this.now(),
      publicAddress: this.account.address
    }

    if (this.platform.is('cordova')) {

      // let msg = now + ' Hello I am ';
      // if (this.name) {
      //   msg = msg + this.name + " - ";
      // }
      // msg = msg + this.account.address;

      this.googleNearby.publish(JSON.stringify(attendee))
        .then((res: any) => {
          let msg = this.name + " sent message to nearby attendees!";
          this.toast(msg)
        })
        .catch((error: any) => alert("Error" + error));
    }
  }

  toast(msg) {
    let toast = this.toastCtrl.create({
      message: msg,
      duration: 6000,
      position: 'bottom'
    });

    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });

    toast.present();
  }

  itemSelected(item) {

  }

  now() {
    return moment().format('MMMM Do YYYY, h:mm:ss a');
  }


  chirp() {

    const { Chirp } = ChirpConnectSDK;
    // setTimeout( ()=>{
    //   this.setupD3();
    // }, 300 );
    let myName = "Nick";
    Chirp({
      key: 'B8dB7210eC0fFEB3FC7A8cD8E',
      onStateChanged: (previous, current) => {
        console.log(current)
      },
      onReceived: async data => {
        if (data.length > 0) {
          let d = String.fromCharCode.apply(null, data);
          let msg = new SpeechSynthesisUtterance('Hey alexa, hello');
          window.speechSynthesis.speak(msg);
          console.log(data);
          let dateCreated = new Date().getTime();
          window.graph.addNodeToRoot(d, dateCreated - this.startDate);
          this.userInfo = await this.github.postUser("U402046");

          if (this.userInfo.signed_in) { // remove the node bc user already signed in
            window.graph.removeNode(d);
            window.graph.removePath(d, this.eventName);
            this.attendeeCount -= 1;
          }
          else {
            window.attendeeList.push({
                'name': this.userInfo.first_name + " " + this.userInfo.last_name,
                'city': this.userInfo.city,
                'userId': this.userInfo.user_id,
                'time': moment(+(this.userInfo.signed_in_time)).format("DD MMM YYYY hh:mmm a"),
                'imgUrl': this.userInfo.image_url
            })
          }

          // this.drawGraph();
        }
      }
    }).then(sdk => {
      sdk.send([0, 1, 2, 3]);
    }).catch(console.error)

  }


  async setupD3() {
    this.userInfo = await this.github.postUser("U402046");
    window.attendeeList.push({
        'name': this.userInfo.first_name + " " + this.userInfo.last_name,
        'city': this.userInfo.city,
        'userId': this.userInfo.user_id,
        'time': new Date().toLocaleTimeString(),
        'imgUrl': this.userInfo.image_url
    })
    this.userInfo = await this.github.postUser("UA17947");
    window.attendeeList.push({
        'name': this.userInfo.first_name + " " + this.userInfo.last_name,
        'city': this.userInfo.city,
        'userId': this.userInfo.user_id,
        'time': new Date().toLocaleTimeString(),
        'imgUrl': this.userInfo.image_url
    })

    //this.setupNearby();
    this.showCount = true;
    this.startDate = new Date().getTime();

    d3.select("#svgdiv").selectAll('*').remove();
    
    $("#attendCnt").html("0 attendees");

    let graph;

    var self = this;

    function myGraph(id) {
        let width = screen.width;
        let height = screen.height * 0.4;
        let radius = 25;
        let minPath = 20;

        // Add and remove elements on the graph object
        this.addNode = function (id) {
            nodes.push({"id": id});
            update();
            this.attendeeCount += 1;
        };

        this.addNodeToRoot = function(id, time) {
            nodes.push({"id": id});
            links.push({"source": findNode(id), "target": nodes[0], "value": 12 + time * 0.0001});
            update();
            keepNodesOnTop();
        }

        this.countNodes = function() {
          return $( $(d3.select("svg")[0][0]).children('g')[0] ).children('g').length;
        }

        this.removeNode = function (id) {
            let i = 0;
            let n = findNode(id); // loop through to find id
            while (i < links.length) {
                if ((links[i]['source'] == n) || (links[i]['target'] == n)) {
                    links.splice(i, 1);
                }
                else i++;
            }
            nodes.splice(findNodeIndex(id), 1);
            update();
        };

        this.removeLink = function (source, target) {
            for (let i = 0; i < links.length; i++) {
                if (links[i].source.id == source && links[i].target.id == target) {
                    links.splice(i, 1);
                    break;
                }
            }
            update();
        };

        this.removeallLinks = function () {
            links.splice(0, links.length);
            update();
        };

        this.removeAllNodes = function () {
            nodes.splice(0, links.length);
            update();
        };

        this.addLink = function (source, target, value) {
            links.push({"source": findNode(source), "target": findNode(target), "value": value});
            update();
            keepNodesOnTop();
        };

        let findNode = function (id) {
            for (let i in nodes) {
                if (nodes[i]["id"] === id) return nodes[i];
            };
        };

        let findNodeIndex = function (id) {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].id == id) {
                    return i;
                }
            }
            ;
        };

        // set up the D3 visualisation in the specified element
        let color = d3.scale.category10();

        let vis = d3.select("#svgdiv")
                .append("svg:svg")
                .attr("width", width)
                .attr("height", height)
                .attr("id", "svg")
                .attr("pointer-events", "all")
                .attr("viewBox", "0 0 " + width + " " + height)
                .attr("perserveAspectRatio", "xMinYMid")
                .append('svg:g');

        let force = d3.layout.force();

        let nodes = force.nodes(),
                links = force.links();

        let update = () => {

            let link = vis.selectAll("line")
                    .data(links, function (d) {
                        return d.source.id + "-" + d.target.id;
                    });

            link.enter().append("line")
                    .attr("id", function (d) {
                        return d.source.id + "-" + d.target.id;
                    })
                    .attr("stroke-width", function (d) {
                        return d.value / 10;
                    })
                    .style("stroke", "#ccc")
                    .attr("class", "link");
            link.append("title")
                    .text(function (d) {
                        return d.value;
                    });
            link.exit().remove();

            let node = vis.selectAll("g.node")
                    .data(nodes, function (d) {
                        return d.id;
                    });

            let nodeEnter = node.enter().append("g")
                    .attr("class", "node")
                    .call(force.drag)
                    .on("click", function(d) {
                         console.log(d);   
                    });

            nodeEnter.append("svg:circle")
                    .attr("r", radius)
                    .attr("id", function (d) {
                        return "Node;" + d.id;
                    })
                    .attr("class", "nodeStrokeClass")
                    .attr("fill", "white")
                    .attr("stroke",function (d) {
                        for (var i = 0; i < window.attendeeList.length; i++) {
                            let attendee = window.attendeeList[i];
                            if (attendee.userId == d.id) {
                                return "white";
                            }
                        }
                        return "grey";
                    })
                    .on("click", function(d) {
                        for (var i = 0; i < window.attendeeList.length; i++) {
                            let attendee = window.attendeeList[i];
                            if (attendee.userId == d.id) {
                                self.toast("Name: " + attendee.name + "   Time Joined: " + attendee.time + "   City: " + attendee.city);
                                break;
                            }
                        }
                    });


            nodeEnter.append("svg:image")
                    .attr("xlink:href", function (d) {
                        for (var i = 0; i < window.attendeeList.length; i++) {
                            let attendee = window.attendeeList[i];
                            if (attendee.userId == d.id) {
                                return attendee.imgUrl;
                            }
                        }
                        return "assets/imgs/logo.png";
                    })
                    .attr("x",-14)
                    .attr("y",-15)
                    .attr("height",30)
                    .attr("width",30)
                    .on("click", function(d) {
                        for (var i = 0; i < window.attendeeList.length; i++) {
                            let attendee = window.attendeeList[i];
                            if (attendee.userId == d.id) {
                                self.toast("Name: " + attendee.name + "   Time Joined: " + attendee.time + "   City: " + attendee.city);
                                break;
                            }
                        }
                    });

            nodeEnter.append("svg:text")
                    .attr("class", "textClass")
                    .attr("x", 30)
                    .attr("y", ".31em")
                    .text(function (d) {
                        return d.id;
                    })
                    .style("font-size","14pt");

            node.exit().remove();

            force.on("tick", function () {

                node.attr("transform", function (d) {
                    d.x = Math.max(radius, Math.min(width - radius, d.x));
                    d.y = Math.max(radius, Math.min(height - radius, d.y));
                    return "translate(" + d.x + "," + d.y + ")";
                });

                link.attr("x1", function (d) {
                    return d.source.x;
                })
                    .attr("y1", function (d) {
                        return d.source.y;
                    })
                    .attr("x2", function (d) {
                        return d.target.x;
                    })
                    .attr("y2", function (d) {
                        return d.target.y;
                    });
            });

            // Restart the force layout.
            force
                    .gravity(.01)
                    .charge(-80000)
                    .friction(0.1)
                    .linkDistance( function(d) { return d.value * 10 } )
                    .size([width, height])
                    .start();
            try{
              $("#attendCnt").html(window.graph.countNodes()-1 + " attendees");
            }
            catch(e){}


        };


        // Make it all go
        update();
    }

   // let self = this;

    function drawGraph(root: string, startDate: number) {
        let minPath = 20;
        graph = new myGraph("#svgdiv");
        graph.addNode(root);
        graph.addNodeToRoot('UA17947', new Date().getTime() - startDate);
        graph.addNodeToRoot('U402046',new Date().getTime() - startDate);
        keepNodesOnTop();      

        window.graph = graph;

        $("#attendCnt").html(graph.countNodes()-1 + " attendees");
    }

    drawGraph(this.eventName, this.startDate);

    this.attendeeCount = graph.countNodes();

    // because of the way the network is created, nodes are created first, and links second,
    // so the lines were on top of the nodes, this just reorders the DOM to put the svg:g on top
    function keepNodesOnTop() {
        $(".nodeStrokeClass").each(function( index ) {
            let gnode = this.parentNode;
            gnode.parentNode.appendChild(gnode);
        });
    }

    function addNodes() {
        d3.select("svg")
                .remove();

         drawGraph(this.eventName, this.startDate);
    }


  }

  async displayGithubData(){

    this.issues = await this.github.getIssues();
    this.comments = await this.github.getComments();

  }


}