
export enum PermissionResources {
  account = 'account',
  transaction = 'transaction',
  session = 'session',
}

export type ResourceConfig = {
  [key in keyof typeof PermissionResources]: string[]
};

export type Permission = {
  resource: keyof typeof PermissionResources
  action: string
  identities: string[]
};

export type Resource = {
  name: keyof typeof PermissionResources
  permissions: Permission[]
}

class ResourcePermissionBuilder {
  private readonly builder: PermissionsBuilder;
  private readonly resource: Resource;
  constructor(resource: Resource, permissionsBuilder: PermissionsBuilder) {
    this.resource = resource;
    this.builder = permissionsBuilder;
  }

  allow(...actions) {
    this.addActionPermissions(actions);
    return this;
  }

  allowEverything() {
    this.addActionPermissions(this.builder.getResourceActions(this.resource.name));
    return this;
  }

  andBuild() {
    return this.builder.build();
  }

  on(...identities) {
    this.setPermissionsIdentities(identities);
    return this.builder;
  }

  onAny() {
    this.setPermissionsIdentities(['*']);
    return this.builder;
  }

  private setPermissionsIdentities(identities: any[]) {
    this.resource.permissions = this.resource.permissions.map(permission => {
      return {
        ...permission,
        identities,
      };
    });
  }

  private addActionPermissions(actions) {
    const isAnyActionUnknown = actions.some(action => !this.builder.isValidAction(this.resource.name, action));

    if (isAnyActionUnknown) {
      const invalidActions = actions.filter(action => !this.builder.isValidAction(this.resource.name, action));
      throw new Error(`Unknown actions: ${invalidActions.join(', ')} for resource ${this.resource.name}`);
    }

    this.resource.permissions = actions.map(action => {
      return {
        resource: this.resource.name,
        action,
        identities: []
      };
    })
  }
}
export class PermissionsBuilder {
  private readonly resources: Resource[] = [];
  private readonly resourceConfig: ResourceConfig = {
    account: ['create', 'read', 'update', 'delete'],
    transaction: ['sign'],
    session: ['list', 'revoke'],
  }
  constructor() {}

  forResource(resourceName: keyof typeof PermissionResources) {
    if (!this.resourceConfig.hasOwnProperty(resourceName)) {
      throw new Error(`Unknown resource: ${resourceName}`);
    }

    const resource = {
      name: resourceName,
      permissions: []
    };
    this.resources.push(resource);
    return new ResourcePermissionBuilder(resource, this);
  }

  build () {
    return this.resources.reduce((permissions: Permission[], resource) =>
      permissions.concat(resource.permissions), []);
  }

  getResourceActions(resource: keyof typeof PermissionResources) {
    return this.resourceConfig[resource];
  }

  isValidAction(resource: keyof typeof PermissionResources, action: string) {
    const validActions = this.getResourceActions(resource)
    return validActions && validActions.includes(action);
  }
}
