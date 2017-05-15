import * as moment from "moment";

import { UrlQuery } from "../src";

class TestQueryClass
{
    @UrlQuery.UrlQueryParam(UrlQuery.StringConverter, { urlKey: "sm" })
    stringMember: string;

    @UrlQuery.UrlQueryParam(UrlQuery.IntConverter, { urlKey: "im" })
    intMember: number;
     
    @UrlQuery.UrlQueryParam(UrlQuery.IsoDateConverter)
    dateMember: Date;

    @UrlQuery.UrlQueryParam(UrlQuery.BoolConverter)
    boolMember: boolean;
    
    @UrlQuery.UrlQueryParam(UrlQuery.IntArrayConverter)
    intArrayMember: number[];

    @UrlQuery.UrlQueryParam(UrlQuery.StringArrayConverter)
    stringArrayMember: string[];

    @UrlQuery.UrlQueryParam(UrlQuery.StringConverter, { urlKey: "ro", readOnly: true })
    readOnlyMember: string;

    equals(other: TestQueryClass): boolean
    { 
        return this.stringMember === other.stringMember &&
            this.intMember === other.intMember &&
            moment(this.dateMember).toISOString() === moment(other.dateMember).toISOString() &&
            this.boolMember === other.boolMember &&
            Util.arraysEqual(this.intArrayMember, other.intArrayMember) &&
            Util.arraysEqual(this.stringArrayMember, other.stringArrayMember);
    }
}

describe("UrlQuery : ",
    () =>
    {
        let fullQueryObject: TestQueryClass;
        let fullFromUrlObject: Object;
        let fullToUrlObject: Object;
        

        let emptyQueryObject: TestQueryClass;
        let emptyUrlObject: Object;
        beforeAll(() =>
        {
            fullQueryObject = new TestQueryClass();
            fullQueryObject.stringMember = "Hey";
            fullQueryObject.intMember = 47;
            fullQueryObject.dateMember = moment("2016-01-01T00:00:00Z").toDate();
            fullQueryObject.boolMember = true;
            fullQueryObject.intArrayMember = [4, 2, 5, 1];
            fullQueryObject.stringArrayMember = ["string 1", "string awesome", "(another-string)"];
            fullQueryObject.readOnlyMember = "Read Only";

            fullFromUrlObject = {
                sm: "Hey",
                im: "47",
                dateMember: moment("2016-01-01T00:00:00Z").toISOString(),
                boolMember: "t",
                intArrayMember: "4;2;5;1",
                stringArrayMember: "string 1;string awesome;(another-string)",
                ro: "Read Only"
            };

            fullToUrlObject = {
                sm: "Hey",
                im: "47",
                dateMember: moment("2016-01-01T00:00:00Z").toISOString(),
                boolMember: "t",
                intArrayMember: "4;2;5;1",
                stringArrayMember: "string 1;string awesome;(another-string)"
            };


            emptyQueryObject = new TestQueryClass();
            emptyUrlObject = {};

        });

        describe("UrlQueryParam decorator : ",
            () =>
            {
                it("has metadata",
                    () =>
                    {
                        expect(UrlQuery.getUrlParams(TestQueryClass.prototype).length).toBe(7);
                    });

                it("metadata has correct propertyKeys",
                    () =>
                    {
                        const queryParams = UrlQuery.getUrlParams(TestQueryClass.prototype);
                        let propCount = 0;

                        for (let prop in fullQueryObject)
                        {
                            if(prop === "equals") continue;
                            expect(queryParams.find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === prop)).toBeDefined();
                            propCount++;
                        }
                        
                        expect(propCount).toBeGreaterThanOrEqual(queryParams.length);
                    });

                it("metadata has correct urlKeys",
                    () =>
                    {
                        const queryParams = UrlQuery.getUrlParams(TestQueryClass.prototype);
                        let propCount = 0;

                        for (let prop in fullQueryObject)
                        {
                            if (prop === "equals") continue;
                            let expectedUrlKey = "";
                            let expectedReadOnly = false;
                            switch (prop)
                            {
                                case "stringMember":
                                    expectedUrlKey = "sm";
                                    break;
                                case "intMember":
                                    expectedUrlKey = "im";
                                    break;
                                case "dateMember":
                                    expectedUrlKey = "dateMember";
                                    break;
                                case "boolMember":
                                    expectedUrlKey = "boolMember";
                                    break;
                                case "intArrayMember":
                                    expectedUrlKey = "intArrayMember";
                                    break;
                                case "stringArrayMember":
                                    expectedUrlKey = "stringArrayMember";
                                    break;
                                case "readOnlyMember":
                                    expectedUrlKey = "ro";
                                    expectedReadOnly = true;
                                    break;
                            }
                            expect(queryParams.find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === prop).urlKey).toEqual(expectedUrlKey);
                            propCount++;
                        }
                        
                        expect(propCount).toBeGreaterThanOrEqual(queryParams.length);
                    });

                it("metadata has converter",
                    () =>
                    {
                        const queryParams = UrlQuery.getUrlParams(TestQueryClass.prototype);
                        let propCount = 0;

                        for (let prop in fullQueryObject)
                        {
                            if(prop === "equals") continue;
                            expect(queryParams.find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === prop).converter).toBeDefined();
                            propCount++;
                        }
                        
                        expect(propCount).toBeGreaterThanOrEqual(queryParams.length);
                    });
            });

        describe("converters : ",
            () =>
            {
                
                it("can convert string from URL",
                    () =>
                    {
                        let target = new TestQueryClass();
                        let queryParam = UrlQuery
                            .getUrlParams(target)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "stringMember") as UrlQuery.UrlQueryParamMetadata;
                        let queryElements = { sm: "A String" };

                        queryParam.converter.fromUrl(queryElements, target, queryParam);

                        expect(target.stringMember).toBeDefined();
                        expect(target.stringMember).toEqual("A String");
                    });

                it("can convert string to URL",
                    () =>
                    {
                        let source = new TestQueryClass();
                        source.stringMember = "A String";
                        let queryParam = UrlQuery
                            .getUrlParams(source)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "stringMember") as UrlQuery.UrlQueryParamMetadata;

                        let result = {};
                        queryParam.converter.toUrl(source, result, queryParam);

                        expect(result).toEqual({ sm: "A String" });
                    });

                it("can convert int from URL",
                    () =>
                    {
                        let target = new TestQueryClass();
                        let queryParam = UrlQuery
                            .getUrlParams(target)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "intMember") as UrlQuery.UrlQueryParamMetadata;
                        let queryElements = { im: 100 };

                        queryParam.converter.fromUrl(queryElements, target, queryParam);
                        
                        expect(target.intMember).toBeDefined();
                        expect(target.intMember).toEqual(100);
                    });

                it("can convert int to URL",
                    () =>
                    {
                        let source = new TestQueryClass();
                        source.intMember = 100;
                        let queryParam = UrlQuery
                            .getUrlParams(source)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "intMember") as UrlQuery.UrlQueryParamMetadata;

                        let result = {};
                        queryParam.converter.toUrl(source, result, queryParam);

                        expect(result).toEqual({ im: "100" });
                    });

                it("can convert boolean t from URL",
                    () =>
                    {
                        let target = new TestQueryClass();
                        let queryParam = UrlQuery
                            .getUrlParams(target)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "boolMember") as UrlQuery.UrlQueryParamMetadata;
                        let queryElements = { boolMember: "t" };

                        queryParam.converter.fromUrl(queryElements, target, queryParam);

                        expect(target.boolMember).toBeDefined();
                        expect(target.boolMember).toEqual(true);
                    });

                it("can convert boolean true from URL",
                    () =>
                    {
                        let target = new TestQueryClass();
                        let queryParam = UrlQuery
                            .getUrlParams(target)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "boolMember") as UrlQuery.UrlQueryParamMetadata;
                        let queryElements = { boolMember: "true" };

                        queryParam.converter.fromUrl(queryElements, target, queryParam);
                        
                        expect(target.boolMember).toBeDefined();
                        expect(target.boolMember).toEqual(true);
                    });

                it("can convert boolean True from URL",
                    () =>
                    {
                        let target = new TestQueryClass();
                        let queryParam = UrlQuery
                            .getUrlParams(target)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "boolMember") as UrlQuery.UrlQueryParamMetadata;
                        let queryElements = { boolMember: "True" };

                        queryParam.converter.fromUrl(queryElements, target, queryParam);

                        expect(target.boolMember).toBeDefined();
                        expect(target.boolMember).toEqual(true);
                    });

                it("can convert boolean f from URL",
                    () =>
                    {
                        let target = new TestQueryClass();
                        let queryParam = UrlQuery
                            .getUrlParams(target)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "boolMember") as UrlQuery.UrlQueryParamMetadata;
                        let queryElements = { boolMember: "f" };

                        queryParam.converter.fromUrl(queryElements, target, queryParam);

                        expect(target.boolMember).toBeDefined();
                        expect(target.boolMember).toEqual(false);
                    });

                it("can convert boolean false from URL",
                    () =>
                    {
                        let target = new TestQueryClass();
                        let queryParam = UrlQuery
                            .getUrlParams(target)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "boolMember") as UrlQuery.UrlQueryParamMetadata;
                        let queryElements = { boolMember: "false" };

                        queryParam.converter.fromUrl(queryElements, target, queryParam);

                        expect(target.boolMember).toBeDefined();
                        expect(target.boolMember).toEqual(false);
                    });

                it("can convert boolean False from URL",
                    () =>
                    {
                        let target = new TestQueryClass();
                        let queryParam = UrlQuery
                            .getUrlParams(target)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "boolMember") as UrlQuery.UrlQueryParamMetadata;
                        let queryElements = { boolMember: "False" };

                        queryParam.converter.fromUrl(queryElements, target, queryParam);

                        expect(target.boolMember).toBeDefined();
                        expect(target.boolMember).toEqual(false);
                    });

                it("can convert boolean garbage from URL",
                    () =>
                    {
                        let target = new TestQueryClass();
                        let queryParam = UrlQuery
                            .getUrlParams(target)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "boolMember") as UrlQuery.UrlQueryParamMetadata;
                        let queryElements = { boolMember: "DFWERCsfa" };

                        queryParam.converter.fromUrl(queryElements, target, queryParam);

                        expect(target.boolMember).toBeDefined();
                        expect(target.boolMember).toEqual(false);
                    });

                it("can convert boolean true to URL",
                    () =>
                    {
                        let source = new TestQueryClass();
                        source.boolMember = true;
                        let queryParam = UrlQuery
                            .getUrlParams(source)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "boolMember") as UrlQuery.UrlQueryParamMetadata;

                        let result = {};
                        queryParam.converter.toUrl(source, result, queryParam);

                        expect(result).toEqual({ boolMember: "t" });
                    });

                it("can convert boolean false to URL",
                    () =>
                    {
                        let source = new TestQueryClass();
                        source.boolMember = false;
                        let queryParam = UrlQuery
                            .getUrlParams(source)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "boolMember") as UrlQuery.UrlQueryParamMetadata;

                        let result = {};
                        queryParam.converter.toUrl(source, result, queryParam);

                        expect(result).toEqual({ boolMember: "f" });
                    });

                it("can convert ISO date from URL",
                    () =>
                    {
                        let target = new TestQueryClass();
                        let queryParam = UrlQuery
                            .getUrlParams(target)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "dateMember") as UrlQuery.UrlQueryParamMetadata;
                        let value = moment().toISOString();
                        let queryElements = { dateMember: value };

                        queryParam.converter.fromUrl(queryElements, target, queryParam);
                        
                        expect(target.dateMember).toBeDefined();
                        expect(moment(target.dateMember).toISOString()).toEqual(value);
                    });

                it("can convert ISO date to URL",
                    () =>
                    {
                        let value = moment();
                        let source = new TestQueryClass();
                        source.dateMember = value.toDate();
                        let queryParam = UrlQuery
                            .getUrlParams(source)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "dateMember") as UrlQuery.UrlQueryParamMetadata;

                        let result = {};
                        queryParam.converter.toUrl(source, result, queryParam);

                        expect(result).toEqual({ dateMember: value.toISOString() });
                    });


                // Int Array

                it("can convert empty int array from URL",
                    () =>
                    {
                        let target = new TestQueryClass();
                        let queryParam = UrlQuery
                            .getUrlParams(target)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "intArrayMember") as UrlQuery.UrlQueryParamMetadata;
                        let queryElements = { intArrayMember: "" }

                        queryParam.converter.fromUrl(queryElements, target, queryParam);

                        expect(target.intArrayMember).toEqual([]);
                    });

                it("can convert empty int array to URL",
                    () =>
                    {
                        let source = new TestQueryClass();
                        source.intArrayMember = [];
                        let queryParam = UrlQuery
                            .getUrlParams(source)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "intArrayMember") as UrlQuery.UrlQueryParamMetadata;

                        let result = {};
                        queryParam.converter.toUrl(source, result, queryParam);

                        expect(result).toEqual({});
                    });
                
                it("can convert single int array from URL",
                    () =>
                    {
                        let target = new TestQueryClass();
                        let queryParam = UrlQuery
                            .getUrlParams(target)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "intArrayMember") as UrlQuery.UrlQueryParamMetadata;
                        let queryElements = { intArrayMember: "1" };

                        queryParam.converter.fromUrl(queryElements, target, queryParam);
                        
                        expect(target.intArrayMember).toBeDefined();
                        expect(target.intArrayMember).toEqual([1]);
                    });

                it("can convert single int array to URL",
                    () =>
                    {
                        let source = new TestQueryClass();
                        source.intArrayMember = [1];
                        let queryParam = UrlQuery
                            .getUrlParams(source)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "intArrayMember") as UrlQuery.UrlQueryParamMetadata;

                        let result = {};
                        queryParam.converter.toUrl(source, result, queryParam);

                        expect(result).toEqual({ intArrayMember: "1" });
                    });

                it("can convert int array from URL",
                    () =>
                    {
                        let target = new TestQueryClass();
                        let queryParam = UrlQuery
                            .getUrlParams(target)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "intArrayMember") as UrlQuery.UrlQueryParamMetadata;
                        let queryElements = { intArrayMember: "1;5;10;-1" };

                        queryParam.converter.fromUrl(queryElements, target, queryParam);
                        
                        expect(target.intArrayMember).toBeDefined();
                        expect(target.intArrayMember).toEqual([1,5,10,-1]);
                    });

                it("can convert int array to URL",
                    () =>
                    {
                    let source = new TestQueryClass();
                        source.intArrayMember = [1,5,10,-1];
                        let queryParam = UrlQuery
                            .getUrlParams(source)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "intArrayMember") as UrlQuery.UrlQueryParamMetadata;

                        let result = {};
                        queryParam.converter.toUrl(source, result, queryParam);

                        expect(result).toEqual({ intArrayMember: "1;5;10;-1" });
                    });


                // String array

                it("can convert empty string array from URL",
                    () =>
                    {
                        let target = new TestQueryClass();
                        let queryParam = UrlQuery
                            .getUrlParams(target)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "stringArrayMember") as UrlQuery.UrlQueryParamMetadata;
                        let queryElements = { stringArrayMember: "" }

                        queryParam.converter.fromUrl(queryElements, target, queryParam);

                        expect(target.stringArrayMember).toEqual([]);
                    });

                it("can convert empty string array to URL",
                    () =>
                    {
                        let source = new TestQueryClass();
                        source.intArrayMember = [];
                        let queryParam = UrlQuery
                            .getUrlParams(source)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "stringArrayMember") as UrlQuery.UrlQueryParamMetadata;

                        let result = {};
                        queryParam.converter.toUrl(source, result, queryParam);

                        expect(result).toEqual({});
                    });

                it("can convert single string array from URL",
                    () =>
                    {
                        let target = new TestQueryClass();
                        let queryParam = UrlQuery
                            .getUrlParams(target)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "stringArrayMember") as UrlQuery.UrlQueryParamMetadata;
                        let queryElements = { stringArrayMember: "string member" };

                        queryParam.converter.fromUrl(queryElements, target, queryParam);

                        expect(target.stringArrayMember).toBeDefined();
                        expect(target.stringArrayMember).toEqual(["string member"]);
                    });

                it("can convert single string array to URL",
                    () =>
                    {
                        let source = new TestQueryClass();
                        source.stringArrayMember = ["string member"];
                        let queryParam = UrlQuery
                            .getUrlParams(source)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "stringArrayMember") as UrlQuery.UrlQueryParamMetadata;

                        let result = {};
                        queryParam.converter.toUrl(source, result, queryParam);

                        expect(result).toEqual({ stringArrayMember: "string member" });
                    });

                it("can convert string array from URL",
                    () =>
                    {
                        let target = new TestQueryClass();
                        let queryParam = UrlQuery
                            .getUrlParams(target)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "stringArrayMember") as UrlQuery.UrlQueryParamMetadata;
                        let queryElements = { stringArrayMember: "string member;another;(string)" };

                        queryParam.converter.fromUrl(queryElements, target, queryParam);

                        expect(target.stringArrayMember).toBeDefined();
                        expect(target.stringArrayMember).toEqual(["string member", "another", "(string)"]);
                    });

                it("can convert string array to URL",
                    () =>
                    {
                        let source = new TestQueryClass();
                        source.stringArrayMember = ["string member", "another", "(string)"];
                        let queryParam = UrlQuery
                            .getUrlParams(source)
                            .find((v: UrlQuery.UrlQueryParamMetadata) => v.propertyKey === "stringArrayMember") as UrlQuery.UrlQueryParamMetadata;

                        let result = {};
                        queryParam.converter.toUrl(source, result, queryParam);

                        expect(result).toEqual({ stringArrayMember: "string member;another;(string)" });
                    });
            });

        describe("toUrl : ",
            () =>
            {
                it("creates url object from full query object",
                    () =>
                    {
                        const result = UrlQuery.toUrlObject(fullQueryObject);

                        expect(result).toEqual(fullToUrlObject);
                    });
                    

                it("creates url object from empty query object",
                    () =>
                    {
                        const result = UrlQuery.toUrlObject(new TestQueryClass());

                        expect(result).toEqual(emptyUrlObject);
                    });
            });

        describe("fromUrl : ",
            () =>
            {
                it("creates query object from full url object",
                    () =>
                    {
                        const result = UrlQuery.fromUrlObject(fullFromUrlObject, TestQueryClass);

                        expect(result).toEqual(fullQueryObject);
                    });
                    
                it("creates query object from empty url object",
                    () =>
                    {
                        const result = UrlQuery.fromUrlObject({}, TestQueryClass);

                        expect(result).toEqual(emptyQueryObject);
                    });
            });
    });