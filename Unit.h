#pragma once
#include <vector>
#include <queue>
#include <utility>
#include "DimasModule/field.h"
#include <stdlib.h>

enum UNITTYPES {
	worker, warrior, scout
};

class Unit
{
private:
	short int XP;
	short int Speed;
	int id;
	short int foodAmount;
	short int maxFood;
	short int idFood;
	UNITTYPES typeAncent;
	std::pair<long int, long int> position;
	std::pair<long int, long int> target; //Цель которую юнит атакует в данный момент
    std::vector<std::pair<long int, long int>> move;
    static std::vector<Unit*> ourAnts, enemyAnts;
    static Field* field;

	void setTarget(int x, int y);
public:
	Unit(int id_, long int x_, long int y_, UNITTYPES typeAncent_);
    std::vector<std::pair<long int, long int>> findingRoad(short int idTacticks);
    void loadAnts();

	
};
