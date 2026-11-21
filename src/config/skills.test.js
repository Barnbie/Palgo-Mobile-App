import { customSkillsOf, mergeCustomSkills, parseList } from './skills';

describe('skills', () => {
  it('splits typed skills into clean names', () => {
    expect(parseList(' dog walker,  tiler ;\nroofer ')).toEqual(['dog walker', 'tiler', 'roofer']);
  });

  it('adds skills typed under Others, once, capitalised', () => {
    expect(mergeCustomSkills(['Chef', 'Others'], 'dog walker, Dog Walker')).toEqual([
      'Chef',
      'Others',
      'Dog walker',
    ]);
  });

  it('ignores the typed text when Others is not selected', () => {
    expect(mergeCustomSkills(['Chef'], 'dog walker')).toEqual(['Chef']);
  });

  it('finds skills that are not in the standard list', () => {
    expect(customSkillsOf(['Chef', 'Dog walker'])).toEqual(['Dog walker']);
  });
});
