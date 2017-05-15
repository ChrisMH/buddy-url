import * as moment from "moment";

export type Indexable = {[i: string]: any};

export namespace UrlQuery
{
    const UrlQueryKey = "UrlQueryKey";

    export class UrlQueryParamConfiguration
    {
        urlKey: string;
        readOnly: boolean;
    }

    /**
     * A property decorator that applied metadata to a class property allowing it to be 
     * serialized to/from a query string
     * 
     * Example usage:
     * 
     * class QueryClass 
     * {
     *     @UrlQueryParam(IsoDateConverter, {urlKey: "stTm"})
     *     startTime: Date;
     * 
     *     @UrlQueryParam(IntConverter) // urlKey will default to pageNumber
     *     pageNumber: number;
     *
     *     @UrlQueryParam(StringConverter)  // urlKey will default to title
     *     title: string;
     * }
     *
     * Configuration object:
     *     urlKey {string} parameter key in the URL
     *     readOnly {boolean} true if the parameter is only read from the url and not written back
     *
     * @param config {Indexable} configuration object
     * @param converterFactory IUrlConverter The converter to use to convert to/from a URL
     * @returns {Function} A factory function used to apply the metadata to the property 
     */
    export function UrlQueryParam(converterFactory: { new(): IUrlConverter }, config?: Indexable): (target: any, propertyKey: string) => void
    {
        return (target: any, propertyKey: string) =>
        {
            let _config = config as UrlQueryParamConfiguration || new UrlQueryParamConfiguration();

            if (_config.urlKey === undefined)
                _config.urlKey = propertyKey;
            if (_config.readOnly === undefined)
                _config.readOnly = false;
                
            if (converterFactory == null)
                throw `UrlQueryParam: converterFactory is undefined for urlKey '${_config.urlKey}'`;
            
            let classData = Reflect.get(target, UrlQueryKey);
            if (!classData)
            {
                classData = new UrlQueryClassMetadata();
                Reflect.defineProperty(target, UrlQueryKey, { value: classData } );
            }

            const urlParam = new UrlQueryParamMetadata(_config.urlKey, _config.readOnly, propertyKey, new converterFactory());

            classData.urlParams.push(urlParam);
        };
    }


    /**
     * Converts an object decorated with UrlQueryParam to a plain object
     * usable by $location.search or $state
     * 
     * @param query TQuery The object to serialize
     * @returns {Indexable} The resulting object
     */
    export function toUrlObject<TQuery>(query: TQuery): Indexable 
    {
        const urlParams = UrlQuery.getUrlParams(query);
        let result: Indexable = {}

        for(let i = 0 ; i < urlParams.length ; i++)
        {
            if (urlParams[i].readOnly || !urlParams[i].converter)
                continue;

            urlParams[i].converter.toUrl(query, result, urlParams[i])
        }

        return result;
    }

    /**
     * Converts an object decorated with UrlQueryParam to a plain object
     * usable by $location.search or $state
     * 
     * @param query TQuery The object to serialize
     * @returns {string} The resulting object
    */
    export function toUrlString<TQuery>(query: TQuery): string {
        return urlObjectToQueryString(toUrlObject(query));
    }


    /**
     * Deserializes data from a url into an object of the supplied type
     * 
     * @param params {Indexable} parameters from the URL.  typically $location.search() or $state.params
     * @param resultType { new() : TQuery } the desired object type
     * @returns {TQuery} An object created with the parameters in the URL
     */
    export function fromUrlObject<TQuery>(params: Indexable, resultType: { new(): TQuery }): TQuery
    {
        const result = new resultType();
        const urlParams = UrlQuery.getUrlParams(result);

        for(let i = 0 ; i < urlParams.length ; i++)
        {
            if(!urlParams[i].converter)
                continue;

            urlParams[i].converter.fromUrl(params, result, urlParams[i]);
        }

        return result;
    }

    export function fromUrl<TQuery>(url: string, resultType: { new (): TQuery }): TQuery
    {        
        return fromUrlObject(getQuery(url), resultType);
    }

    export function fromUrlString<TQuery>(queryString: string, resultType: { new (): TQuery }): TQuery {
        return fromUrlObject(getQuery(queryString), resultType);
    }

    export function urlObjectToQueryString(urlObject: any): string
    {
        let parts = new Array<string>();
        for (let prop in urlObject)
        {
            parts.push(`${prop}=${urlObject[prop]}`);
        }
        return parts.join("&");
    }

       
    export function getUrlParams(target: any): Array<UrlQueryParamMetadata>
    {
        const meta = Reflect.get(target, UrlQueryKey) as UrlQueryClassMetadata;
        if (!meta)
            return new Array<UrlQueryParamMetadata>();
        return meta.urlParams;
        
    }

    function getQuery(url: string): Indexable
    {        
        let urlParts = url.split("?");
        let queryPart = urlParts.length === 1 ? urlParts[0] : urlParts[1];
        
        let result: Indexable = {};

        queryPart.split("&").forEach((p: string) =>
        {
            let paramParts = p.split("=");
            result[paramParts[0]] = paramParts.length === 1 ? true : paramParts[1];
        });

        return result;
    }

    export class UrlQueryClassMetadata
    {
        urlParams = new Array<UrlQueryParamMetadata>();
    }

    export class UrlQueryParamMetadata
    {
        constructor(public urlKey: string, public readOnly: boolean, public propertyKey: string, public converter: IUrlConverter)
        {
        }
    }

    export interface IUrlConverter
    {
        toUrl: (source: Indexable, target: Indexable, pi: UrlQueryParamMetadata) => void;
        fromUrl: (source: Indexable, target: Indexable, pi: UrlQueryParamMetadata) => void;
    }

    export class StringConverter implements IUrlConverter
    {
        toUrl(source: Indexable, target: Indexable, pi: UrlQueryParamMetadata): void
        {
            if(!source.hasOwnProperty(pi.propertyKey) || source[pi.propertyKey] === undefined)
                return;

            target[pi.urlKey] = source[pi.propertyKey];
        }

        fromUrl(source: Indexable, target: Indexable, pi: UrlQueryParamMetadata): void
        {
            var value = source.hasOwnProperty(pi.urlKey) ? source[pi.urlKey] : undefined;
            if (value !== undefined)
                target[pi.propertyKey] = value;
        }
    }

    export class IntConverter implements IUrlConverter
    {
        toUrl(source: Indexable, target: Indexable, pi: UrlQueryParamMetadata): void
        {
            if (!source.hasOwnProperty(pi.propertyKey) || source[pi.propertyKey] === undefined)
                return;

            target[pi.urlKey] = source[pi.propertyKey].toString();
        }

        fromUrl(source: Indexable, target: Indexable, pi: UrlQueryParamMetadata): void
        {
            var value = source.hasOwnProperty(pi.urlKey) ? source[pi.urlKey] : undefined;
            if (value !== undefined)
                target[pi.propertyKey] = parseInt(value);
        }
    }

    export class BoolConverter implements IUrlConverter
    {
        toUrl(source: Indexable, target: Indexable, pi: UrlQueryParamMetadata): void
        {
            if (!source.hasOwnProperty(pi.propertyKey) || source[pi.propertyKey] === undefined)
                return;

            target[pi.urlKey] = source[pi.propertyKey] === true ? "t" : "f";
        }

        fromUrl(source: Indexable, target: Indexable, pi: UrlQueryParamMetadata): void
        {
            var value = source.hasOwnProperty(pi.urlKey) ? source[pi.urlKey] : undefined;
            if (value !== undefined)
                target[pi.propertyKey] = (value === "True" || value == "true" || value === "t") ? true : false;
        }
    }

    export class IsoDateConverter implements IUrlConverter
    {
        toUrl(source: Indexable, target: Indexable, pi: UrlQueryParamMetadata): void
        {
            if (!source.hasOwnProperty(pi.propertyKey) || source[pi.propertyKey] === undefined)
                return;

            target[pi.urlKey] = moment(source[pi.propertyKey]).toISOString();
        }

        fromUrl(source: Indexable, target: Indexable, pi: UrlQueryParamMetadata): void
        {
            var value = source.hasOwnProperty(pi.urlKey) ? source[pi.urlKey] : undefined;
            if (value !== undefined)
                target[pi.propertyKey] = moment(value).toDate();
            
        }
    }

    export class IntArrayConverter implements IUrlConverter
    {
        toUrl(source: Indexable, target: Indexable, pi: UrlQueryParamMetadata): void
        {
            if (!source.hasOwnProperty(pi.propertyKey) || source[pi.propertyKey] === undefined
               || !(source[pi.propertyKey] instanceof Array) || (source[pi.propertyKey] as any[]).length === 0)
                return;
            
            target[pi.urlKey] = (source[pi.propertyKey] as any[]).join(";");
        }
        
        fromUrl(source: Indexable, target: any, pi: UrlQueryParamMetadata): any
        {
            var value = source.hasOwnProperty(pi.urlKey) ? source[pi.urlKey] : undefined;
            if (value !== undefined)
            {
                let array: number[] = [];

                if (value.length > 0)
                {
                    let elements = value.split(";");
                    elements.forEach((e: string) => array.push(parseInt(e)));
                }
                
                target[pi.propertyKey] = array;
            }
        }
    }

    export class StringArrayConverter implements IUrlConverter
    {
        toUrl(source: Indexable, target: Indexable, pi: UrlQueryParamMetadata): void
        {
            if (!source.hasOwnProperty(pi.propertyKey) || source[pi.propertyKey] === undefined
                || !(source[pi.propertyKey] instanceof Array) || (source[pi.propertyKey] as any[]).length === 0)
                return;

            target[pi.urlKey] = (source[pi.propertyKey] as any[]).join(";");
        }

        fromUrl(source: Indexable, target: any, pi: UrlQueryParamMetadata): any
        {
            var value = source.hasOwnProperty(pi.urlKey) ? source[pi.urlKey] : undefined;
            if (value !== undefined)
            {
                let array: string[] = [];

                if (value.length > 0)
                {
                    let elements = value.split(";");
                    elements.forEach((e: string) => array.push(e));
                }

                target[pi.propertyKey] = array;
            }
        }
    }
}