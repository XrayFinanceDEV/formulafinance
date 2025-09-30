# Ra-Core Main Documentation

## Overview

**ra-core** is a headless single-page application framework for React. It provides battle-tested hooks and components to build high-performance apps with react-query, react-hook-form, react-router, and TypeScript on top of any REST or GraphQL API. Used by React-Admin, shadcn-admin-kit, and thousands of developers.

---

## Table of Contents

1. [App Configuration](#app-configuration)
2. [Data Provider Setup](#data-provider-setup)
3. [Authentication](#authentication)
4. [Authorization](#authorization)
5. [List Pages Tutorial](#list-pages-tutorial)
6. [Filtering the List](#filtering-the-list)
7. [Edit Tutorial](#edit-tutorial)
8. [Form Validation](#form-validation)
9. [Input Components](#input-components)
10. [Show Pages](#show-pages)
11. [Fields](#fields)
12. [Custom Routes](#custom-routes)
13. [Preferences/Store](#preferences-store)
14. [Record Context](#record-context)
15. [Querying the API](#querying-the-api)

---

## App Configuration

The `<CoreAdmin>` component is the root component of a ra-core app. It allows to configure the application adapters, routes, and core functionalities.

`CoreAdmin` creates a series of context providers to allow its children to access the app configuration. It renders the main routes and delegates the rendering of the content area to its children.

### Basic Usage

`CoreAdmin` requires only a `dataProvider` prop, and at least one child `Resource` to work:

```jsx
import { CoreAdmin, Resource } from 'ra-core';
import simpleRestProvider from 'ra-data-simple-rest';
import { PostList } from './posts';

const App = () => (
    <CoreAdmin dataProvider={simpleRestProvider('http://path.to.my.api')}>
        <Resource name="posts" list={PostList} />
    </CoreAdmin>
);

export default App;
```

### Complete Example

```jsx
import { CoreAdmin, Resource, CustomRoutes } from 'ra-core';
import { Route } from "react-router-dom";
import { dataProvider, authProvider, i18nProvider } from './providers';
import { Layout } from './layout';
import { Dashboard } from './dashboard';
import { Login } from './login';
import { CustomerList, CustomerEdit } from './customers';
import { OrderList, OrderEdit } from './orders';
import { Settings } from './settings';

const App = () => (
    <CoreAdmin
        dataProvider={dataProvider}
        authProvider={authProvider}
        i18nProvider={i18nProvider}
        layout={Layout}
        dashboard={Dashboard}
        loginPage={Login}
    >
        <Resource name="customers" list={CustomerList} edit={CustomerEdit} />
        <Resource name="orders" list={OrderList} edit={OrderEdit} />
        <CustomRoutes>
            <Route path="/settings" element={<Settings />} />
        </CustomRoutes>
    </CoreAdmin>
);
```

### Main Props

| Prop | Required | Type | Default | Description |
|------|----------|------|---------|-------------|
| `dataProvider` | Required | `DataProvider` | - | The data provider for fetching resources |
| `children` | Required | `ReactNode` | - | The routes to render |
| `authProvider` | Optional | `AuthProvider` | - | The authentication provider |
| `i18nProvider` | Optional | `I18NProvider` | - | The internationalization provider |
| `layout` | Optional | `Component` | - | The content of the layout |
| `dashboard` | Optional | `Component` | - | The content of the dashboard page |
| `loginPage` | Optional | `Component` | - | The content of the login page |
| `requireAuth` | Optional | `boolean` | `false` | Flag to require authentication for all routes |

### dataProvider

The `dataProvider` is the only required prop. It must be an object with methods for communicating with the API:

```jsx
const dataProvider = {
    getList: (resource, params) => Promise.resolve(),
    getOne: (resource, params) => Promise.resolve(),
    getMany: (resource, params) => Promise.resolve(),
    getManyReference: (resource, params) => Promise.resolve(),
    create: (resource, params) => Promise.resolve(),
    update: (resource, params) => Promise.resolve(),
    updateMany: (resource, params) => Promise.resolve(),
    delete: (resource, params) => Promise.resolve(),
    deleteMany: (resource, params) => Promise.resolve(),
};
```

---

## Data Provider Setup

The Data Provider is the interface between ra-core and your API. It's where you write the API calls to fetch and save data.

### Basic Setup

```jsx
import { CoreAdmin, Resource } from 'ra-core';
import simpleRestProvider from 'ra-data-simple-rest';
import { PostList } from './posts';

const dataProvider = simpleRestProvider('http://path.to.my.api/');

const App = () => (
    <CoreAdmin dataProvider={dataProvider}>
        <Resource name="posts" list={PostList} />
    </CoreAdmin>
);
```

### API Mapping

The Simple REST data provider maps ra-core calls to API calls:

| Method name | API call |
|-------------|----------|
| `getList` | `GET http://my.api.url/posts?sort=["title","ASC"]&range=[0, 24]&filter={"title":"bar"}` |
| `getOne` | `GET http://my.api.url/posts/123` |
| `getMany` | `GET http://my.api.url/posts?filter={"ids":[123,456,789]}` |
| `create` | `POST http://my.api.url/posts` |
| `update` | `PUT http://my.api.url/posts/123` |
| `delete` | `DELETE http://my.api.url/posts/123` |

### Adding Authentication Headers

```jsx
import { fetchUtils } from 'ra-core';
import simpleRestProvider from 'ra-data-simple-rest';

const httpClient = (url, options = {}) => {
    if (!options.headers) {
        options.headers = new Headers({ Accept: 'application/json' });
    }
    const { token } = JSON.parse(localStorage.getItem('auth'));
    options.headers.set('Authorization', `Bearer ${token}`);
    return fetchUtils.fetchJson(url, options);
};

const dataProvider = simpleRestProvider('http://localhost:3000', httpClient);
```

---

## Authentication

Ra-core supports both authentication and authorization, allowing you to secure your admin app with your preferred authentication strategy.

### Enabling Authentication

By default, ra-core apps do not require authentication. To restrict access, pass an `authProvider` to the `<CoreAdmin>` component:

```jsx
import authProvider from './authProvider';

const App = () => (
    <CoreAdmin authProvider={authProvider}>
        ...
    </CoreAdmin>
);
```

### AuthProvider Interface

```jsx
const authProvider = {
    // send username and password to the auth server and get back credentials
    async login(params) { /** ... **/ },
    // when the dataProvider returns an error, check if this is an authentication error
    async checkError(error) { /** ... **/ },
    // when the user navigates, make sure that their credentials are still valid
    async checkAuth(params) { /** ... **/ },
    // remove local credentials and notify the auth server that the user logged out
    async logout() { /** ... **/ },
    // get the user's profile
    async getIdentity() { /** ... **/ },
    // check whether users have the right to perform an action on a resource (optional)
    async canAccess() { /** ... **/ },
};
```

### Custom Login Page

```jsx
import { useState } from 'react';
import { useLogin, useNotify } from 'ra-core';

const MyLoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const login = useLogin();
    const notify = useNotify();

    const handleSubmit = e => {
        e.preventDefault();
        login({ email, password }).catch(() =>
            notify('Invalid email or password')
        );
    };

    return (
        <form onSubmit={handleSubmit}>
            <h1>Login</h1>
            <div>
                <label htmlFor="email">Email:</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
            </div>
            <div>
                <label htmlFor="password">Password:</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
            </div>
            <button type="submit">Login</button>
        </form>
    );
};
```

---

## Authorization

Ra-core provides two ways to implement authorization:

1. **Access control** relies on `authProvider.canAccess({ resource, action })`
2. **Permissions** rely on `authProvider.getPermissions()`

### Access Control

The `authProvider.canAccess()` method determines if the user can access a specific resource or perform a particular action:

```jsx
const authProvider = {
    async canAccess({ resource, action }) {
        const permissions = JSON.parse(localStorage.getItem('permissions'));
        return permissions.some(p => p.resource === resource && p.action === action);
    },
};
```

### Using useCanAccess Hook

```jsx
import { useCanAccess } from 'ra-core';
import { DeleteButton } from './DeleteButton';

const DeleteCommentButton = ({ record }) => {
    const { isPending, error, canAccess } = useCanAccess({
        action: 'delete',
        resource: 'comments',
    });
    
    if (isPending || error || !canAccess) return null;
    
    return <DeleteButton resource="comments" record={record} />;
};
```

---

## List Pages Tutorial

The List view displays a list of records and lets users search for specific records using filters, sorting, and pagination.

### Manual List Implementation

```jsx
import { useState } from 'react';
import { useGetList } from 'ra-core';

const BookList = () => {
    const [filter, setFilter] = useState('');
    const [page, setPage] = useState(1);
    const perPage = 10;
    
    const { data, total, isPending } = useGetList('books', {
        filter: { q: filter },
        pagination: { page, perPage },
        sort: { field: 'id', order: 'ASC' }
    });

    if (isPending) return <div>Loading...</div>;

    return (
        <div>
            <h1>Book list</h1>
            <input
                placeholder="Search"
                value={filter}
                onChange={e => setFilter(e.target.value)}
            />
            <table>
                <thead>
                    <tr>
                        <th>Id</th>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Year</th>
                    </tr>
                </thead>
                <tbody>
                    {data?.map(book => (
                        <tr key={book.id}>
                            <td>{book.id}</td>
                            <td>{book.title}</td>
                            <td>{book.author}</td>
                            <td>{book.year}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
```

### Using ListBase Component

```jsx
import { ListBase } from 'ra-core';
import { FilterForm } from './FilterForm';
import { Pagination } from './Pagination';
import { BookTable } from './BookTable';

const filters = [{ source: 'q', label: 'Search' }];

const BookList = () => (
    <ListBase>
        <div>
            <h1>Book list</h1>
            <FilterForm filters={filters} />
            <BookTable />
            <Pagination />
        </div>
    </ListBase>
);
```

### Custom Components with ListContext

```jsx
import { useListContext } from 'ra-core';

const FilterForm = ({ filters }) => {
    const { filterValues, setFilters } = useListContext();

    const handleChange = (key, value) => {
        const newValues = { ...filterValues, [key]: value };
        setFilters(newValues);
    };

    return (
        <div style={{ marginBottom: '1rem' }}>
            {filters.map(filter => (
                <input
                    key={filter.source}
                    placeholder={filter.label}
                    value={filterValues[filter.source] || ''}
                    onChange={e => handleChange(filter.source, e.target.value)}
                    style={{ marginRight: '0.5rem' }}
                />
            ))}
        </div>
    );
};

const BookTable = () => {
    const { data } = useListContext();

    return (
        <table>
            <thead>
                <tr>
                    <th>Id</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Year</th>
                </tr>
            </thead>
            <tbody>
                {data?.map(book => (
                    <tr key={book.id}>
                        <td>{book.id}</td>
                        <td>{book.title}</td>
                        <td>{book.author}</td>
                        <td>{book.year}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
```

---

## Filtering the List

Ra-core offers powerful filter components for building custom filter interfaces.

### Filter Query Parameters

Ra-core uses the `filter` query parameter from the URL to determine the filters to apply:

```
https://myadmin.dev/#/posts?filter={"commentable":true,"q":"lorem "}
```

This leads to the following data provider call:

```jsx
dataProvider.getList('posts', {
    filter: { commentable: true, q: 'lorem ' },
    pagination: { page: 1, perPage: 10 },
    sort: { field: 'published_at', order: 'DESC' },
});
```

### Using FilterLiveForm

```jsx
import { FilterLiveForm } from 'ra-core';
import { TextInput } from './TextInput';
import { SelectInput } from './SelectInput';

const LiveFilterForm = () => (
    <FilterLiveForm>
        <div style={{ display: 'flex', gap: '16px' }}>
            <div>
                <label>Search:</label>
                <TextInput
                    source="q"
                    placeholder="Search posts..."
                />
            </div>
            <div>
                <label>Category:</label>
                <SelectInput
                    source="category"
                    choices={[
                        { id: '', name: 'All categories' },
                        { id: 'news', name: 'News' },
                        { id: 'tutorials', name: 'Tutorials' },
                    ]}
                />
            </div>
        </div>
    </FilterLiveForm>
);
```

### Custom Filter with Submit

```jsx
import { useState } from 'react';
import { useListContext } from 'ra-core';

const CustomFilterForm = () => {
    const { filterValues, setFilters } = useListContext();
    const [localFilters, setLocalFilters] = useState(filterValues);

    const handleSubmit = (e) => {
        e.preventDefault();
        setFilters(localFilters);
    };

    const handleReset = () => {
        setLocalFilters({});
        setFilters({});
    };

    return (
        <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                <div>
                    <label>Search:</label>
                    <input
                        type="search"
                        value={localFilters.q || ''}
                        onChange={(e) => setLocalFilters(prev => ({ ...prev, q: e.target.value }))}
                        placeholder="Search..."
                    />
                </div>
                <button type="submit">Apply</button>
                <button type="button" onClick={handleReset}>Reset</button>
            </div>
        </form>
    );
};
```

---

## Edit Tutorial

Ra-core provides hooks and components to build custom user experiences for editing and creating records, leveraging react-hook-form.

### Manual Edit Implementation

```jsx
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { useGetOne, useUpdate } from "ra-core";

export const BookEdit = () => {
    const { id } = useParams();
    const { handleSubmit, reset, control } = useForm();
    const { isPending } = useGetOne("books", { id }, { onSuccess: (data) => reset(data) });
    const [update, { isPending: isSubmitting }] = useUpdate();
    const navigate = useNavigate();
    
    const onSubmit = (data) => {
        update("books", { id, data }, { onSuccess: () => navigate('/books') });
    };

    if (isPending) return null;

    return (
        <div>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div>
                    <Controller
                        name="title"
                        render={({ field }) => (
                            <div>
                                <label htmlFor="title">Title</label>
                                <input id="title" {...field} />
                            </div>
                        )}
                        control={control}
                    />
                    <Controller
                        name="author"
                        render={({ field }) => (
                            <div>
                                <label htmlFor="author">Author</label>
                                <input id="author" {...field} />
                            </div>
                        )}
                        control={control}
                    />
                </div>
                <button type="submit" disabled={isSubmitting}>Save</button>
            </form>
        </div>
    );
};
```

### Using Form Component

```jsx
import { Form } from 'ra-core';
import { TextInput } from './TextInput';

export const BookEdit = () => {
    // ... data fetching logic

    return (
        <div>
            <Form record={data} onSubmit={onSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <TextInput source="title" label="Title" />
                    <TextInput source="author" label="Author" />
                    <button type="submit">Save</button>
                </div>
            </Form>
        </div>
    );
};
```

### Using EditBase

```jsx
import { EditBase, Form } from "ra-core";
import { TextInput } from "./TextInput";

export const BookEdit = () => (
    <EditBase>
        <Form>
            <h1>Edit Book</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <TextInput source="title" label="Title" />
                <TextInput source="author" label="Author" />
                <button type="submit">Save</button>
            </div>
        </Form>
    </EditBase>
);
```

---

## Form Validation

Ra-core relies on react-hook-form for form validation and supports several approaches:

- Form-level validation using the `validate` prop
- Input-level validation using the `validate` prop  
- Schema validation using the `resolver` prop
- Server-side validation

### Global Validation

```jsx
const validateUserCreation = (values) => {
    const errors = {};
    if (!values.firstName) {
        errors.firstName = 'The firstName is required';
    }
    if (!values.age) {
        errors.age = 'ra.validation.required';
    } else if (values.age < 18) {
        errors.age = {
            message: 'ra.validation.minValue',
            args: { min: 18 }
        };
    }
    return errors;
};

export const UserCreate = () => (
    <CreateBase>
        <Form validate={validateUserCreation}>
            <TextInput label="First Name" source="firstName" validate={required()} />
            <TextInput label="Age" source="age" validate={required()} />
        </Form>
    </CreateBase>
);
```

### Built-in Field Validators

```jsx
import {
    required,
    minLength,
    maxLength,
    minValue,
    maxValue,
    number,
    regex,
    email,
    choices
} from 'ra-core';

const validateFirstName = [required(), minLength(2), maxLength(15)];
const validateEmail = email();
const validateAge = [number(), minValue(18)];
const validateZipCode = regex(/^\d{5}$/, 'Must be a valid Zip Code');

export const UserCreate = () => (
    <CreateBase>
        <Form>
            <TextInput source="firstName" validate={validateFirstName} />
            <TextInput source="email" validate={validateEmail} />
            <TextInput source="age" validate={validateAge}/>
            <TextInput source="zip" validate={validateZipCode}/>
        </Form>
    </CreateBase>
);
```

### Schema Validation with Yup

```jsx
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Form, CreateBase } from 'ra-core';

const schema = yup
    .object()
    .shape({
        name: yup.string().required(),
        age: yup.number().required(),
    })
    .required();

const CustomerCreate = () => (
    <CreateBase>
        <Form resolver={yupResolver(schema)}>
            <TextInput source="name" />
            <NumberInput source="age" />
        </Form>
    </CreateBase>
);
```

### Async Validation

```jsx
const validateEmailUnicity = async (value) => {
    const isEmailUnique = await checkEmailIsUnique(value);
    if (!isEmailUnique) {
        return 'Email already used';
    }
    return undefined;
};

const emailValidators = [required(), validateEmailUnicity];

export const UserCreate = () => (
    <CreateBase>
        <Form>
            <TextInput label="Email" source="email" validate={emailValidators} />
        </Form>
    </CreateBase>
);
```

---

## Input Components

Input components display form inputs and are used in Edit and Create views, and in List Filters.

### Using useInput Hook

```jsx
import { useInput } from 'ra-core';

const TextInput = ({ source, label }) => {
    const { field } = useInput({ source });
    
    return (
        <div>
            <label htmlFor={source}>{label}</label>
            <input id={source} {...field} />
        </div>
    );
};

const SelectInput = ({ source, label, choices }) => {
    const { field } = useInput({ source });
    
    return (
        <div>
            <label htmlFor={source}>{label}</label>
            <select id={source} {...field}>
                {choices.map(choice => (
                    <option key={choice.id} value={choice.id}>
                        {choice.name}
                    </option>
                ))}
            </select>
        </div>
    );
};
```

### Advanced Input with Validation

```jsx
import { useInput, required } from 'ra-core';

const BoundedInput = (props) => {
    const { onChange, onBlur, label, helperText, ...rest } = props;
    const {
        field,
        fieldState: { invalid, error },
        isRequired
    } = useInput({
        onChange,
        onBlur,
        ...rest,
    });

    return (
        <div>
            <label htmlFor={field.name}>
                {label}
                {isRequired && <span aria-hidden="true"> *</span>}
            </label>
            <input
                id={field.name}
                {...field}
                aria-invalid={invalid}
                aria-errormessage={`${field.name}-error`}
                {...rest}
            />
            {invalid && error?.message ? (
                <div id={`${field.name}-error`} role="alert">
                    {error.message}
                </div>
            ) : helperText !== false ? (
                <div className="helper-text">
                    {helperText}
                </div>
            ) : null}
        </div>
    );
};
```

### Linking Two Inputs

```jsx
import { useWatch } from 'react-hook-form';
import { EditBase, Form } from 'ra-core';
import { SelectInput } from './SelectInput';

const cities = {
    USA: ["New York", "Los Angeles", "Chicago"],
    UK: ["London", "Birmingham", "Glasgow"],
    France: ["Paris", "Marseille", "Lyon"],
};

const CityInput = () => {
    const country = useWatch({ name: "country" });

    return (
        <SelectInput
            choices={country ? cities[country].map(city => ({ id: city, name: city })) : []}
            source="cities"
        />
    );
};

const OrderEdit = () => (
    <EditBase>
        <Form>
            <SelectInput
                source="country"
                choices={["USA", "UK", "France"].map(c => ({ id: c, name: c }))}
            />
            <CityInput />
        </Form>
    </EditBase>
);
```

---

## Show Pages

`<ShowBase>` fetches the record from the data provider via `dataProvider.getOne()`, puts it in a `ShowContext`, and renders its child.

### Basic Usage

```jsx
import { ShowBase } from 'ra-core';

const PostShow = () => (
    <ShowBase resource="posts">
        <div style={{ display: 'flex' }}>
            <div style={{ flex: 2 }}>
                <div>
                    {/* Show form content */}
                </div>
            </div>
            <div style={{ flex: 1 }}>
                Show instructions...
            </div>
        </div>
    </ShowBase>
);
```

### Show with Fields

```jsx
import { ShowBase, ReferenceFieldBase, WithRecord } from 'ra-core';
import { TextField } from './TextField';
import { DateField } from './DateField';

const BookShow = () => (
    <ShowBase>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div>
                <TextField label="Title" source="title" />
            </div>
            <div>
                <ReferenceFieldBase label="Author" source="author_id" reference="authors">
                    <TextField source="name" />
                </ReferenceFieldBase>
            </div>
            <div>
                <DateField label="Publication Date" source="published_at" />
            </div>
            <div>
                <WithRecord render={record => (
                    <div>
                        {record.rating >= 1 ? '⭐' : '☆'}
                        {record.rating >= 2 ? '⭐' : '☆'}
                        {record.rating >= 3 ? '⭐' : '☆'}
                        {record.rating >= 4 ? '⭐' : '☆'}
                        {record.rating >= 5 ? '⭐' : '☆'}
                    </div>
                )} />
            </div>
        </div>
    </ShowBase>
);
```

---

## Fields

A `Field` component displays a given property of a record. Such components are used in the `List` and `Show` views.

### Creating Custom Fields

```jsx
import { useRecordContext } from 'ra-core';

const FullNameField = (props) => {
    const record = useRecordContext(props);
    return record ? <span>{record.firstName} {record.lastName}</span> : null;
};

// Usage
export const UserList = () => (
    <ListBase>
        <div>
            <FullNameField />
        </div>
    </ListBase>
);
```

### Field with Deep Source

```jsx
import { useFieldValue } from 'ra-core';

const TextField = (props) => {
    const value = useFieldValue(props);
    return value ? <span>{value}</span> : null;
}

// Usage with nested data
<TextField source="author.name" />
```

### Conditional Field Display

```jsx
import { ShowBase, useRecordContext } from 'ra-core';
import { TextField } from './TextField';

const EmailField = ({ source }) => {
    const record = useRecordContext();
    return record ? <span>{record[source]}</span> : null;
};

const ConditionalEmailField = () => {
    const record = useRecordContext();
    return record && record.hasEmail ? <EmailField source="email" /> : null;
}

const UserShow = () => (
    <ShowBase>
        <div>
            <TextField source="first_name" />
            <TextField source="last_name" />
            <ConditionalEmailField />
        </div>
    </ShowBase>
);
```

---

## Custom Routes

Lets you define custom pages in your ra-core application, using react-router-dom `<Route>` elements.

### Basic Usage

```jsx
import { CoreAdmin, Resource, CustomRoutes } from 'ra-core';
import { Route } from "react-router-dom";
import { dataProvider } from './dataProvider';
import posts from './posts';
import { Settings } from './Settings';
import { Profile } from './Profile';

const App = () => (
    <CoreAdmin dataProvider={dataProvider}>
        <Resource name="posts" {...posts} />
        <CustomRoutes>
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
        </CustomRoutes>
    </CoreAdmin>
);
```

### Routes Without Layout

```jsx
import { CoreAdmin, CustomRoutes } from 'ra-core';
import { Route } from "react-router-dom";
import { Register } from './Register';
import { Settings } from './Settings';

const App = () => (
    <CoreAdmin dataProvider={dataProvider}>
        <CustomRoutes noLayout>
            <Route path="/register" element={<Register />} />
        </CustomRoutes>
        <CustomRoutes>
            <Route path="/settings" element={<Settings />} />
        </CustomRoutes>
    </CoreAdmin>
);
```

### Securing Custom Routes

```jsx
import { CoreAdmin, CustomRoutes, Authenticated } from 'ra-core';
import { Route } from "react-router-dom";
import { Settings } from './Settings';

const App = () => (
    <CoreAdmin dataProvider={dataProvider}>
        <CustomRoutes>
            <Route path="/settings" element={<Authenticated><Settings /></Authenticated>} />
        </CustomRoutes>
    </CoreAdmin>
);
```

### Sub-Routes

```jsx
import { CoreAdmin, Resource } from 'ra-core';
import { Route } from "react-router-dom";
import posts from './posts';

const App = () => (
    <CoreAdmin dataProvider={dataProvider}>
        <Resource name="posts" {...posts}>
            <Route path="analytics" element={<PostAnalytics/>} />
        </Resource>
    </CoreAdmin>
);

// Equivalent to:
const App = () => (
    <CoreAdmin dataProvider={dataProvider}>
        <Resource name="posts" {...posts} />
        <CustomRoutes>
            <Route path="/posts/analytics" element={<PostAnalytics />} />
        </CustomRoutes>
    </CoreAdmin>
);
```

---

## Preferences/Store

The `useStore` hook allows to read and write from the Store. Stored values are available globally and are persisted between page reloads.

### Basic Usage

```jsx
import { useStore } from 'ra-core';

const [value, setValue] = useStore(key, defaultValue);
```

The `key` should be a string, and is used for local storage. The store can contain values of any type as long as they can be serialized with `JSON.stringify()`.

### Example

```jsx
import { ListBase, useStore } from 'ra-core';

const PostList = () => {
    const [density] = useStore('posts.list.density', 'small');

    return (
        <ListBase>
            <div style={{ padding: density === 'small' ? '0.5em' : '1em' }}>
                ...
            </div>
        </ListBase>
    );
}

// Anywhere else in the app
const ChangeDensity = () => {
    const [density, setDensity] = useStore('posts.list.density', 'small');

    const changeDensity = () => {
        setDensity(density === 'small' ? 'medium' : 'small');
    };

    return (
        <button onClick={changeDensity}>
            Toggle Density ({density})
        </button>
    );
};
```

### Built-in Stores

- `memoryStore`: stores data in memory
- `localStorageStore`: stores data in localStorage

```jsx
import { CoreAdmin, Resource, memoryStore } from 'ra-core';

const App = () => (
    <CoreAdmin dataProvider={dataProvider} store={memoryStore()}>
        <Resource name="posts" />
    </CoreAdmin>
);
```

---

## Record Context

`useRecordContext` grabs the current record. It's available anywhere ra-core manipulates a record, e.g. in a Show page, in a DataTable row, or in a Reference Field.

### Basic Usage

```jsx
import { useRecordContext, ShowBase } from 'ra-core';

const BookAuthor = () => {
    const record = useRecordContext();
    if (!record) return null;
    return <span>{record.author}</span>;
};

const BookShow = () => (
    <ShowBase>
        <BookAuthor />
        ...
    </ShowBase>
);
```

### Always Check for Record

Ra-core uses optimistic rendering, so `useRecordContext` may be `undefined` on load:

```jsx
const BookAuthor = () => {
    const record = useRecordContext();
    if (!record) return null;  // Always check!
    return <span>{record.author}</span>;
};
```

### Inside Forms

Inside `<Form>`, `useRecordContext` returns the initial record. To react to user input, use react-hook-form's `useWatch`:

```jsx
import { EditBase, Form } from 'ra-core';
import { useWatch } from 'react-hook-form';

const ReturnedReason = () => {
    const isReturned = useWatch({ name: 'returned' });
    return isReturned ? <TextInput source="reason" /> : null;
};

const OrderEdit = () => (
    <EditBase>
        <Form>
            <TextInput source="reference" />
            <BooleanInput source="returned" />
            <ReturnedReason />
        </Form>
    </EditBase>
);
```

### Creating Record Context

```jsx
import { useGetOne, RecordContextProvider } from 'ra-core';

const RecordFetcher = ({ id, resource, children }) => {
    const { data, isPending, error } = useGetOne(resource, { id });
    if (isPending) return <p>Loading...</p>;
    if (error) return <p>Error :(</p>;
    return (
        <RecordContextProvider value={data}>
            {children}
        </RecordContextProvider>
    );
};
```

---

## Querying the API

Ra-core provides special hooks to emit read and write queries to the `dataProvider`, which uses React Query to call the `dataProvider` and cache the results.

### Getting dataProvider Instance

```jsx
import { useDataProvider } from 'ra-core';

const UserProfile = ({ userId }) => {
    const dataProvider = useDataProvider();
    const [user, setUser] = useState();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState();

    useEffect(() => {
        dataProvider.getOne('users', { id: userId })
            .then(({ data }) => {
                setUser(data);
                setLoading(false);
            })
            .catch(error => {
                setError(error);
                setLoading(false);
            })
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error</div>;
    if (!user) return null;

    return (
        <ul>
            <li>Name: {user.name}</li>
            <li>Email: {user.email}</li>
        </ul>
    );
};
```

### Query Hooks

Ra-core provides query hooks for each Data Provider read method:

- `useGetList` calls `dataProvider.getList()`
- `useGetOne` calls `dataProvider.getOne()`
- `useGetMany` calls `dataProvider.getMany()`
- `useGetManyReference` calls `dataProvider.getManyReference()`

```jsx
import { useGetOne } from 'ra-core';

const UserProfile = ({ userId }) => {
    const { isPending, error, data: user } = useGetOne('users', { id: userId });

    if (isPending) return <div>Loading...</div>;
    if (error) return <div>Error</div>;
    if (!user) return null;

    return (
        <ul>
            <li>Name: {user.name}</li>
            <li>Email: {user.email}</li>
        </ul>
    );
};
```

### Mutation Hooks

Ra-core provides mutation hooks for each Data Provider write method:

- `useCreate` calls `dataProvider.create()`
- `useUpdate` calls `dataProvider.update()`
- `useUpdateMany` calls `dataProvider.updateMany()`
- `useDelete` calls `dataProvider.delete()`
- `useDeleteMany` calls `dataProvider.deleteMany()`

```jsx
import { useUpdate, useRecordContext } from 'ra-core';

const ApproveButton = () => {
    const record = useRecordContext();
    const [approve, { isPending }] = useUpdate('comments', {
        id: record.id,
        data: { isApproved: true },
        previousData: record
    });

    return (
        <button onClick={() => approve()} disabled={isPending}>
            {isPending ? 'Approving...' : 'Approve'}
        </button>
    );
};
```

### Success and Error Side Effects

```jsx
import { useUpdate, useNotify, useRedirect, useRecordContext } from 'ra-core';

const ApproveButton = () => {
    const record = useRecordContext();
    const notify = useNotify();
    const redirect = useRedirect();
    
    const [approve, { isPending }] = useUpdate('comments', {
        id: record.id,
        data: { isApproved: true },
        previousData: record
    }, {
        onSuccess: (data) => {
            redirect('/comments');
            notify('Comment approved');
        },
        onError: (error) => {
            notify(`Comment approval error: ${error.message}`, { type: 'error' });
        },
    });

    return <button onClick={() => approve()} disabled={isPending}>Approve</button>;
};
```

### Optimistic Rendering

```jsx
const [approve, { isPending }] = useUpdate('comments', {
    id: record.id,
    data: { isApproved: true }
}, {
    mutationMode: 'optimistic',
    onSuccess: () => {
        redirect('/comments');
        notify('Comment approved');
    },
});
```

### Using React Query Directly

```jsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { useDataProvider } from 'ra-core';

const UserProfile = ({ userId }) => {
    const dataProvider = useDataProvider();
    const { data, isPending, error } = useQuery({
        queryKey: ['users', 'getOne', { id: userId }],
        queryFn: ({ signal }) => dataProvider.getOne('users', { id: userId, signal })
    });

    if (isPending) return <div>Loading...</div>;
    if (error) return <div>Error</div>;
    if (!data) return null;

    return (
        <ul>
            <li>Name: {data.data.name}</li>
            <li>Email: {data.data.email}</li>
        </ul>
    );
};
```

---

This comprehensive documentation covers the main concepts and usage patterns of ra-core, providing a foundation for building headless admin applications with React.