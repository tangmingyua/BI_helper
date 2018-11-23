const dynamic_json = require('../lib/dynamic-json.js');
const djUserActions = new dynamic_json.DynamicJSON('user_actions_sql.json', 900);
const settings = require('../settings-' + (process.env.profile || 'dev') + '.json');
const mongo = require('./mongo-ndbcV2');

const user_actions_col = new mongo.MongoCollection(settings['mongo_feheadline_connect_url'], 'user_actions', settings['mongo_feheadline_pool_size']);

const traObject = function(finalJson,updateJson){//通过递归实现底层值的替换
    for(let k in finalJson){
        if((typeof finalJson[k])!='object'){
            if(updateJson[finalJson[k]]){
                finalJson[k] = updateJson[finalJson[k]];
            }
        } else {
            traObject(finalJson[k],updateJson);
        }
    }
}

const getData = function(query_title,update_content,finalCallback){//获取查询结果
    djUserActions.get((err,results)=>{
        let query_sql = {};
        for(let k of results){
            if(k['query_title']==query_title){//通过遍历查找title的查询语句
                query_sql = JSON.parse(results[0]['query_sql']);
                break;
            }
        }
        traObject(query_sql,update_content);//替换其中的参数
        user_actions_col.aggregate(query_sql,result=>{
            finalCallback(result);
        })
    })
}

exports.getData = getData;


