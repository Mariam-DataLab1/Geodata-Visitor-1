//@ts-check
import * as wellKnown from "wellknown";// Well-known text (WKT) is a text markup language for representing vector geometry objects.
import _ from "lodash";
// import App {useState, useEffect} from "./App";
import { SingleObject } from "../reducer";
// import { StatisticValue } from "semantic-ui-react";
export interface SparqlResults {
    head: Head;
    results: {
        bindings: Binding[];
    };
}
export interface Head {
    vars: string[];
}
export interface Binding {
    [varname: string]: BindingValue;
}

export type BindingValue =
    | {
        type: "uri";
        value: string;
    }
    | {
        type: number; 
        value: string
    }
    | {
        type: "literal"; 
        value: string
    };

/**
 * Convert the sparql json results into a Result.js array
 * @param results
 */
export async function queryResourcesDescriptions(lat: string, lng: string, iris: string[]): Promise<SingleObject[]> {
    let res = await runQuery(lat, lng);

    // The sparql results for 1 iri may span multiple rows. So, group them
    const groupedByIri = _.groupBy(res.results.bindings, b => b.sub.value); //s is the iri variable name
    return iris
        .map(iri => {
            const bindings = groupedByIri[iri];
            if (!bindings) return undefined;
            const firstBinding = bindings[0];
            let geoJson: any;

            if (firstBinding.geo) {
                let wktJson = bindings[0].geo.value;
                geoJson = wellKnown.parse(wktJson);
            }
            return {
                
                sub: iri,
                geo: geoJson,
            };
        })
        .filter(i => !!i);
}

// export async function searchResourcesDescriptions(postcode: string, housenumber: string, iris: string[]): Promise<SingleObject[]> {
// let res = await searchQuery(postcode, housenumber);

export async function searchResourcesDescriptions( res:SparqlResults): Promise<SingleObject[]> {
        // let res = await searchQuery();   

    //The sparql results for 1 iri may span multiple rows. So, group them
    
    const groupedByIri = _.groupBy(res.results.bindings, b => b.sub.value); //s is the iri variable name
    return Object.entries(groupedByIri).map(([iri, bindings]: [iri: string, bindings: Array<Binding>]) => {
        if (!bindings) return undefined;
            let subHost = new URL(iri).host
            let geoJson: any = null
            let properties: any = {}
            for(let binding of bindings) {
                let propName = ''
                
                try {
                    if(new URL(binding.pred.value).host === subHost) {
                        propName = binding.pred.value.split('/').slice(-1)[0]
                    }
                } catch (error) {}
                
                let value = binding.obj.value
                if(/^POLYGON\(\(.*\)\)$/i.test(value)) {
                    geoJson = wellKnown.parse(value)
                } else if(propName) {
                    properties[propName] = value
                }
            }
            return {
                sub: iri,
                geo: geoJson,
                ...properties

            };
    }).filter(i => i);
    // return res.results.bindings.map(b => {
    //     let iri = b.sub.value
    //     const bindings = groupedByIri[iri];
    //         if (!bindings) return undefined;
    //         let geoJson: any = null
    //         let properties: any = {}
    //         for(let binding of bindings) {
    //             let propName = binding.pred.value.split('/').slice(-1)[0]
    //             let value = binding.obj.value
    //             if(/^POLYGON\(\(.*\)\)$/i.test(value)) {
    //                 geoJson = wellKnown.parse(value)
    //             } else {
    //                 properties[propName] = value
    //             }
    //         }
    //         return {
    //             sub: iri,
    //             geo: geoJson,
    //             ...properties

    //         };
    // }).filter(i => i);
}

/**
 * 
 * @param lat 
 * @param long 
 * @param precisie 
 */
export async function runQuery(lat: string, long: string): Promise<SparqlResults> {
    const sparqlApi = 'https://api.labs.kadaster.nl/queries/jiarong-li/PandviewerTest/run';
    let sufUrl = '?lat=' + lat + '&long=' + long;
    let runApi = sparqlApi + sufUrl;
    const result = await fetch(runApi, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/sparql-results+json"
        },

    });
    if (result.status > 300) {
        throw new Error("Request with response " + result.status);
    }

    return JSON.parse(await result.text());

}

export async function searchQuery(endpoint:string): Promise<SparqlResults> {
    const result = await fetch(endpoint, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/sparql-results+json"
        },
    });
    if (result.status > 300) {
        throw new Error("Request with response " + result.status);
    }

    return result.json();
}


//polygon
// https://api.data.pldn.nl/queries/Mariam/Query-15/run
// https://api.data.pldn.nl/queries/Mariam/Query-16/run   it works with address
// https://api.data.pldn.nl/queries/Mariam/Query-17/run  it is pilot emotion and costs

// Zero query 
// https://api.data.pldn.nl/queries/Mariam/Query-29/run
// https://api.data.pldn.nl/queries/Mariam/Query-30/run
// https://api.data.pldn.nl/queries/Mariam/Query-32/run

// npm run dev