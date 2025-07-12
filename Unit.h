#pragma once
#include <vector>
#include <queue>
#include <utility>

enum UNITTYPES {
	worker, warrior, scout
};

class Unit
{
private:
	short int XP;
	short int Speed;
	int id;
	//long int x, y;
	short int foodAmount;
	short int maxFood;
	short int idFood;
	UNITTYPES typeAncent;
	std::pair<long int, long int> position;
	std::pair<long int, long int> target; //Цель которую юнит атакует в данный момент
	std::vector<std::vector<int> > move;

	void setTarget(int x, int y);
public:
	Unit(int id_, long int x_, long int y_, UNITTYPES typeAncent_);

	std::vector<std::vector<int> > findingRoad(short int idTacticks);

	
};