

window.FRESHFIND_MARKET_DATA = (function () {
  'use strict';

  var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var WEEK_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  var SHORT_DAY = { Sunday:'Sun', Monday:'Mon', Tuesday:'Tue', Wednesday:'Wed', Thursday:'Thu', Friday:'Fri', Saturday:'Sat' };

  
  var markets = [
    
    { id:'clifton-farmers', name:'Clifton Farmers Market', area:'Clifton', location:'Boat Basin, Clifton',
      address:'Boat Basin, Clifton, Karachi, Pakistan', lat:24.8138, lng:67.0305,
      days:['Saturday','Sunday'], open:'08:00', close:'14:00',
      produce:['Fruit','Vegetables','Organic','Honey'], items:['Mango','Banana','Tomato','Spinach','Raw honey'],
      image:'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=800&q=70' },
    { id:'dha-organic', name:'DHA Organic Market', area:'DHA', location:'DHA Phase 5',
      address:'DHA Phase 5, Karachi, Pakistan', lat:24.7996, lng:67.0622,
      days:['Friday','Saturday'], open:'09:00', close:'15:00',
      produce:['Organic','Vegetables','Fruit','Eggs'], items:['Lettuce','Kale','Free-range eggs','Strawberry','Carrot'],
      image:'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=70' },
    { id:'gulshan-fresh', name:'Gulshan Fresh Produce Market', area:'Gulshan', location:'Gulshan-e-Iqbal',
      address:'Gulshan-e-Iqbal, Karachi, Pakistan', lat:24.9205, lng:67.0911,
      days:['Saturday','Sunday'], open:'07:00', close:'13:00',
      produce:['Fruit','Vegetables','Eggs'], items:['Potato','Onion','Eggs','Watermelon','Mango'],
      image:'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=70' },
    { id:'bahadurabad-local', name:'Bahadurabad Local Market', area:'Bahadurabad', location:'Bahadurabad',
      address:'Bahadurabad, Karachi, Pakistan', lat:24.8815, lng:67.0687,
      days:['Wednesday','Saturday'], open:'08:00', close:'13:00',
      produce:['Fruit','Vegetables','Honey'], items:['Apple','Banana','Honey','Cucumber'],
      image:'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=70' },
    { id:'north-nazimabad', name:'North Nazimabad Farmers Market', area:'North Nazimabad', location:'North Nazimabad',
      address:'North Nazimabad, Karachi, Pakistan', lat:24.9374, lng:67.0551,
      days:['Sunday'], open:'08:00', close:'14:00',
      produce:['Fruit','Vegetables','Eggs','Organic'], items:['Guava','Okra','Eggs','Mint','Tomato'],
      image:'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=800&q=70' },
    { id:'clifton-block-4', name:'Clifton Block 4 Market', area:'Clifton', location:'Clifton Block 4',
      address:'Clifton Block 4, Karachi, Pakistan', lat:24.8167, lng:67.0258,
      days:['Friday','Saturday'], open:'10:00', close:'16:00',
      produce:['Fruit','Vegetables','Honey'], items:['Orange','Grapes','Honey','Brinjal'],
      image:'https://images.unsplash.com/photo-1573246123716-6b1782bfc499?auto=format&fit=crop&w=800&q=70' },
    
    { id:'saddar-sunday', name:'Saddar Sunday Bazaar', area:'Saddar', location:'Saddar Town',
      address:'Saddar Town, Karachi, Pakistan', lat:24.8607, lng:67.0011,
      days:['Sunday'], open:'07:00', close:'13:00',
      produce:['Fruit','Vegetables','Honey'], items:['Mango','Watermelon','Tomato','Onion','Raw honey'],
      image:'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=70' },
    { id:'pechs-community', name:'PECHS Community Market', area:'PECHS', location:'PECHS Block 6',
      address:'PECHS Block 6, Karachi, Pakistan', lat:24.8714, lng:67.0645,
      days:['Saturday','Sunday'], open:'08:00', close:'14:00',
      produce:['Fruit','Vegetables','Organic','Herbs'], items:['Kale','Basil','Mint','Strawberry','Cherry tomato'],
      image:'https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=800&q=70' },
    { id:'korangi-creek', name:'Korangi Creek Farmers Market', area:'Korangi', location:'Korangi Creek',
      address:'Korangi Creek, Karachi, Pakistan', lat:24.8286, lng:67.1479,
      days:['Friday','Saturday'], open:'08:00', close:'13:00',
      produce:['Vegetables','Eggs','Fruit'], items:['Okra','Brinjal','Free-range eggs','Banana','Lemon'],
      image:'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=70' },
    { id:'malir-farmers', name:'Malir Farmers Bazaar', area:'Malir', location:'Malir Cantt',
      address:'Malir Cantt, Karachi, Pakistan', lat:24.8939, lng:67.1917,
      days:['Sunday'], open:'09:00', close:'15:00',
      produce:['Fruit','Vegetables','Honey','Eggs'], items:['Guava','Pomegranate','Honey','Farm eggs','Spinach'],
      image:'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=70' }
  ];

  

  function uniqueSorted(list) {
    return Array.from(new Set(list)).sort(function (a, b) {
      return a.localeCompare(b);
    });
  }

  var areas = uniqueSorted(markets.map(function (m) { return m.area; }));

  
  var PRODUCE_ORDER = ['Fruit','Vegetables','Organic','Eggs','Honey','Herbs'];
  var produce = PRODUCE_ORDER.filter(function (p) {
    return markets.some(function (m) { return m.produce.indexOf(p) !== -1; });
  });

  return {
    DAYS: DAYS,
    WEEK_ORDER: WEEK_ORDER,
    SHORT_DAY: SHORT_DAY,
    markets: markets,
    areas: areas,
    produce: produce
  };
})();


