#ifndef FIELD_H
#define FIELD_H

#include <vector>
#include <string>
#include <fstream>
#include <sstream>
#include <utility>
#include "json-3.12.0/single_include/nlohmann/json.hpp"
enum HEX_TYPE {ROCK, ACID, HIVE, MUD, EMPTY, UNKNOWN, MAP_EDGE};
enum FOOD_TYPE {BREAD, APPLE, NECTAR};
using json = nlohmann::json;

struct Hex
{
    HEX_TYPE type;
    FOOD_TYPE foodType;
    short int foodAmount;
    short int cost;
};
//class Unit;
class Field
{
public:
    json data;
    Field(std::string fileName);
    static std::vector<std::pair<long int, long int>> getNearHexes(long int x, long int y)
    {
        std::pair<long int, long int> buff;
        std::vector<std::pair<long int, long int>> ans;
        buff.first = x + 1;
        buff.second = y;
        ans.push_back(buff);
        buff.first = x - 1;
        buff.second = y;
        ans.push_back(buff);
        buff.first = x;
        buff.second = y + 1;
        ans.push_back(buff);
        buff.first = x;
        buff.second = y - 1;
        ans.push_back(buff);
        if(y % 2 == 0)
        {
            buff.first = x - 1;
            buff.second = y - 1;
            ans.push_back(buff);
            buff.first = x - 1;
            buff.second = y + 1;
            ans.push_back(buff);
        }
        else
        {
            buff.first = x + 1;
            buff.second = y - 1;
            ans.push_back(buff);
            buff.first = x + 1;
            buff.second = y + 1;
            ans.push_back(buff);
        }
        return ans;
    }

private:
    long int height, width;
    std::vector<std::vector<Hex>> field;
    //std::vector<Unit> ourAnts, enemyAnts;
};

#endif // FIELD_H
