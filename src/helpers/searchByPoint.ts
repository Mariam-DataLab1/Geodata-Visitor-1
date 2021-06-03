import {queryResourcesDescriptions, searchResourcesDescriptions,runQuery,searchQuery} from "./sparql"; // queryResourcesDescriptions,
// ,searchResourcesDescriptionsCsv,searchQueryCsv
/**
 * 
 * @param lat 
 * @param lng 
 * @returns 
 */
// 
export async function getFromCoordinates(lat : string, lng: string) {
  const results = await runQuery(lat,lng);
  //console.log(await results.results.bindings.map(b => b.bag.value));
  console.log(await results);
  //It stops here
  console.log (await queryResourcesDescriptions(lat, lng, results.results.bindings.map(b => b.sub.value)));
  return await queryResourcesDescriptions(lat, lng, results.results.bindings.map(b => b.sub.value));
}

/**
 * 
 * @param Endpoint
 * @returns 
 */

// This function get data  from interface and returns the results
export async function getFromTextSearch(endpoint:string) {
// get the JSON from API
  const results = await searchQuery(endpoint);
  //console.log(await results.results.bindings.map(b => b.bag.value));
console.log(results);
  //It stops here
//  console.log (await searchResourcesDescriptions(results.results.bindings.map(b => b.person.value)));
 // return JSON to array 
  return searchResourcesDescriptions(results);
}

// mariam

// export async function getFromTextSearchCSV(postcode : string, housenumber: string) {

// //   const results = await searchQueryCsv(geo,person);
// //   return await searchResourcesDescriptionsCsv(geo, person, results.results.bindings.map(b => b.bag.value));
// // }
