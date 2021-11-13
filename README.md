# Hardware  Controls

## 사용자 가이드

### 패키지 이용하기

이 패키지를 설치하려면 먼저 `@ktaicoder` 계정의 패키지가 `github` 패키지 저장소를 사용한다고 설정해야 한다. `.npmrc`에 다음의 내용을 추가한다

```bash
$ cat .npmrc
@ktaicoder:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=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
```

- 이제 다음과 같이 설치할 수 있다.

```
$  yarn add @ktaicoder/hw-control@1.0.4
```


## 개발 가이드

### 패키지 배포 

- 소스코드의 브랜치는 `main`과 `dev` 두개다

- 개발은 `dev` 브랜치에서, 배포는 `main` 브랜치에서 진행한다.

- `main` 브랜치에 소스코드가 푸시되면 `github` 패키지 저장소에 자동으로 배포된다.

- `dev` 브랜치에서 `package.json`과 `package-dist.json`에 버전을 명시한 후에 `main` 브랜치에서 머지한다.

```json
{
  "name": "@ktaicoder/hw-control",
  "version": "1.0.4",
  // ...
}
```
