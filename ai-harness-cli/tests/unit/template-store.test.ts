import { TemplateStore } from '../../src/scaffold/template-store';

describe('TemplateStore', () => {
  let store: TemplateStore;

  beforeEach(() => {
    store = new TemplateStore();
  });

  it('should list bundled components', () => {
    const components = store.getAvailableComponents();
    expect(components).toContain('base');
  });

  it('should return versions for component', () => {
    const versions = store.getComponentVersions('base');
    expect(versions).toContain('1.0.0');
  });

  it('should load component with path', () => {
    const component = store.loadComponent('base', '1.0.0');
    expect(component.name).toBe('base');
    expect(component.version).toBe('1.0.0');
    expect(component.path).toBeDefined();
  });

  it('should get latest version', () => {
    const latest = store.getLatestVersion('base');
    expect(latest).toBe('1.0.0');
  });

  it('should check if component is bundled', () => {
    expect(store.isBundled('base', '1.0.0')).toBe(true);
    expect(store.isBundled('base', '99.0.0')).toBe(false);
  });

  it('should throw for non-existent component', () => {
    expect(() => {
      store.loadComponent('nonexistent', '1.0.0');
    }).toThrow();
  });
});
